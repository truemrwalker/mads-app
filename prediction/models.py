#=================================================================================================
# Project: CADS/MADS - An Integrated Web-based Visual Platform for Materials Informatics
#          Hokkaido University (2018)
#          Last Update: Q2 2025
# ________________________________________________________________________________________________
# Authors: Mikael Nicander Kuwahara (Lead Developer) [2021-]
#          Jun Fujima (Former Lead Developer) [2018-2021]
#          Philippe Gantzer (for predictions of models issued by Optimizer components) [2024-]
# ________________________________________________________________________________________________
# Description: Serverside (Django) Provided models for the 'Prediction' page
# ------------------------------------------------------------------------------------------------
# Notes: This is one part of the serverside module that allows the user to interact with the
#        'prediction' interface of the website. (DB and server Python methods)
# ------------------------------------------------------------------------------------------------
# References: Django platform libraries, private-storage, json, numpy, joblib, logging and uuid libs
#=================================================================================================

#-------------------------------------------------------------------------------------------------
# Import required Libraries
#-------------------------------------------------------------------------------------------------
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.db import models
from django.db.models.signals import post_delete
from django.dispatch import receiver
from django.urls import reverse

from private_storage.fields import PrivateFileField
from jsonfield import JSONField

import joblib
import numpy as np
from csv import reader
import re
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from chython import smiles
from chython.exceptions import IncorrectSmiles
from doptools.chem.coloratom import ColorAtom
from doptools.chem.solvents import available_solvents

from common.models import OwnedResourceModel

import os
import uuid
from itertools import zip_longest

import logging

logger = logging.getLogger(__name__)

#-------------------------------------------------------------------------------------------------


User = get_user_model()

#-------------------------------------------------------------------------------------------------
def get_encoded_filepath(instance, filename):
    filename, file_extension = os.path.splitext(filename)
    return os.path.join(str(instance.owner.uuid), str(instance.id) + file_extension)
#-------------------------------------------------------------------------------------------------


#-------------------------------------------------------------------------------------------------
def delete_previous_file(function):
    """The decorator for deleting unnecessary file.

    :param function: main function
    :return: wrapper
    """
    def wrapper(*args, **kwargs):
        """Wrapper function.

        :param args: params
        :param kwargs: keyword params
        :return: result
        """
        self = args[0]

        # get the previous filename
        result = PretrainedModel.objects.filter(pk=self.pk)
        previous = result[0] if len(result) else None
        super(PretrainedModel, self).save()

        # execution
        result = function(*args, **kwargs)

        # if the previous file exists, delete it.
        if previous and previous.file.name != self.file.name:
            previous.file.delete(False)
        return result
    return wrapper
#-------------------------------------------------------------------------------------------------


#-------------------------------------------------------------------------------------------------
class PretrainedModel(OwnedResourceModel):
    shared_users = models.ManyToManyField(
        'users.User', blank=True,
        related_name='pm_shared_users'
    )
    shared_groups = models.ManyToManyField(
        Group, blank=True, related_name='pm_shared_groups'
    )

    file = PrivateFileField(upload_to=get_encoded_filepath,)
    componentInstance = models.ForeignKey(
        'analysis.ComponentInstance',
        on_delete=models.SET_NULL,
        blank=True, null=True
    )
    metadata = JSONField(blank=True, null=True)

    objects = models.Manager()

    def get_filename(self):
        return os.path.basename(self.file.name)

    def get_absolute_url(self):
        return reverse('prediction:model-detail', kwargs={'id': self.id})

    def get_full_path(self):
        return self.file.full_path

    def get_owned_models(self, user):
        return PretrainedModel.objects.filter(owner=user)

    def get_public_models(self):
        return PretrainedModel.objects.filter(accessibility=PretrainedModel.ACCESSIBILITY_PUBLIC)

    def predict(self, inports, coloratom:bool = False):
        outport = {}
        inputs = []
        model = joblib.load(self.file)

        # Model without DOPtools
        if 'input_type' not in self.metadata.keys() or not self.metadata['input_type'] or self.metadata['input_type'] == "descriptors_values":
            for key, value in inports.items():
                inputs.append(float(value))
            logger.info(inputs)
            out = model.predict([inputs])
            outport = out[0]
            return outport

        #Model using DOPtools
        elif self.metadata['input_type'] == "SMILES":
            mol_fields = self.metadata['input_spec'] if 'input_spec' in self.metadata.keys() else ["SMILES"]
            nb_mol_fields = len(mol_fields)
            to_pred = []
            real_props = []
            for items in list(reader([re.sub('\s+', ' ', x) for x in inports["SMILES"].splitlines()],
                                     delimiter=' ', quotechar='"')):
                line_dict = {}
                line_error = False
                for val, col in zip_longest(items, mol_fields):
                    if not val or not col:
                        if not val:  # required value
                            line_error = True
                        break
                    try:
                        mol = smiles(val)
                        try:
                            mol.canonicalize(fix_tautomers=False)
                        except:
                            mol.canonicalize(fix_tautomers=False)
                        line_dict[col] = mol
                    except IncorrectSmiles:
                        try:
                            nbr = float(val)
                            line_dict[col] = nbr
                        except ValueError:
                            if val in available_solvents:
                                line_dict[col] = val
                            else:
                                line_error = True
                                break
                if not line_error:
                    to_pred.append(line_dict)
                    real_props.append(float(items[-1]) if len(items) > nb_mol_fields else None)

            if not to_pred:
                return pd.DataFrame.from_records([{"ERROR": "No correct item to predict"}])

            to_pred = pd.DataFrame.from_records(to_pred)
            if any([x is not None for x in real_props]):
                to_pred['Real'] = real_props

            to_pred['Predicted'] = model.predict(to_pred['SMILES'].to_list() if nb_mol_fields == 1 else to_pred)

            if coloratom and type(model[2]) in [SVC, RandomForestClassifier]:
                to_pred['ColorAtom'] = ['not available for classification models yet'] * to_pred.shape[0]
            elif coloratom:
                import matplotlib
                matplotlib.use('Agg')
                clr = ColorAtom()
                clr.set_pipeline(model)

                contributions = {n: clr.calculate_atom_contributions(to_pred.iloc[n] if clr.complex else to_pred.iloc[n]['SMILES'])
                                 for n in range(len(to_pred))}
                max_scale = max(abs(v) for contrib in contributions.values() for atom_contrib in contrib.values() for v in atom_contrib.values())
                to_pred['ColorAtom'] = [clr.output_html(to_pred.iloc[n] if clr.complex else to_pred.iloc[n]['SMILES'],
                                                        ipython=False, external_limits=[-max_scale, max_scale],
                                                        contributions=contributions[n])
                                        for n in range(len(to_pred))]

                colorbar_row = {x: '' for x in to_pred}
                colorbar_row['ColorAtom'] = "<span style='text-align:center'>{}<p style='margin:0; padding:0;'>Color scale</p></span>".format(
                    clr.output_colorbar_html(-max_scale, max_scale,10, 2, orient='horizontal', ipython=False))
                to_pred = pd.concat((to_pred, pd.DataFrame([colorbar_row])))

            for col in mol_fields:
                to_pred[col] = [str(x) for x in to_pred[col]]

            return to_pred

        else:
            return outport

    @delete_previous_file
    def save(self, force_insert=False, force_update=False, using=None, update_fields=None):
        super(PretrainedModel, self).save()

    @delete_previous_file
    def delete(self, using=None, keep_parents=False):
        super(PretrainedModel, self).delete()
#-------------------------------------------------------------------------------------------------


#-------------------------------------------------------------------------------------------------
# when deleting model the file is removed
@receiver(post_delete, sender=PretrainedModel)
def delete_file(sender, instance, **kwargs):
    instance.file.delete(False)
#-------------------------------------------------------------------------------------------------
