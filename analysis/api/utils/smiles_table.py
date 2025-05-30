#=================================================================================================
# Project: CADS/MADS - An Integrated Web-based Visual Platform for Materials Informatics
#          Hokkaido University (2018)
#          Last Update: Q2 2025
# ________________________________________________________________________________________________
# Authors: Philippe Gantzer [2024-]
#          Pavel Sidorov [2024-]
# ________________________________________________________________________________________________
# Description: Serverside (Django) rest api utils for the 'Analysis' page involving
#              'smiles_table' components
# ------------------------------------------------------------------------------------------------
# Notes:  This is one of the REST API parts of the 'analysis' interface of the website that
#         allows serverside work for the 'smiles_table' component.
# ------------------------------------------------------------------------------------------------
# References: logging, pandas and chython libs
#=================================================================================================

import logging
from chython import smiles
from chython.algorithms import depict as DEPICT

logger = logging.getLogger(__name__)


def get_mol_svg(data):
    DEPICT.depict_settings(aam=False)
    svg_strings = {}
    for col in data['view']['settings']['smiles_columns']:
        svg_strings[col] = []
        for line in data['data']:
            if col in line.keys():
                try:
                    mol = smiles(line[col])
                    if mol:
                        try:
                            mol.canonicalize()
                        except:
                            mol.canonicalize()
                        mol.clean2d()
                        line[col] = mol.depict(height="100px", width="200px")
                    else:
                        raise Exception()
                except:
                    line[col] = "Not parsable "+str(line[col])

    return {'data': data}
