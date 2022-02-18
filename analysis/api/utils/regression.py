#=================================================================================================
# Project: CADS/MADS - An Integrated Web-based Visual Platform for Materials Informatics
#          Hokkaido University (2018)
# ________________________________________________________________________________________________
# Authors: Jun Fujima (Former Lead Developer) [2018-2021]
#          Mikael Nicander Kuwahara (Current Lead Developer) [2021-]
# ________________________________________________________________________________________________
# Description: Serverside (Django) rest api utils for the 'Analysis' page involving
#              regression components
# ------------------------------------------------------------------------------------------------
# Notes:  This is one of the REST API parts of the 'analysis' interface of the website that
#         allows serverside work for the 'regression' component.
# ------------------------------------------------------------------------------------------------
# References: logging, numpy, pandas and sklearn libs
#=================================================================================================

#-------------------------------------------------------------------------------------------------
# Import required Libraries
#-------------------------------------------------------------------------------------------------
import logging
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.linear_model import Lasso
from sklearn.ensemble import RandomForestRegressor
from sklearn.ensemble import ExtraTreesRegressor
from sklearn.neural_network import MLPRegressor
from sklearn.kernel_ridge import KernelRidge
from sklearn.svm import SVR
from sklearn.model_selection import cross_validate, KFold

logger = logging.getLogger(__name__)
#-------------------------------------------------------------------------------------------------


#-------------------------------------------------------------------------------------------------
def get_regression(data):
    feature_columns = data['view']['settings']['featureColumns']
    target_column = data['view']['settings']['targetColumn']
    folds = data['view']['settings']['folds']
    method = data['view']['settings']['method']
    method_args = data['view']['settings']['methodArguments']

    dataset = data['data']
    df = pd.DataFrame(dataset)

    df_train = df[feature_columns]
    X = df_train.values

    df_target = df[target_column]
    y = df_target.values

    reg = None
    cv_model = None

    if method == 'Linear':
        reg = LinearRegression(fit_intercept=True, normalize=False)
        cv_model = LinearRegression(fit_intercept=True, normalize=False)
    elif method == 'Lasso':
        reg = Lasso()
        cv_model = Lasso()
    elif method == 'SVR':
        reg = SVR(C=float(method_args['arg1']), gamma=float(method_args['arg2']))
        cv_model = SVR(C=float(method_args['arg1']), gamma=float(method_args['arg2']))
    elif method == 'RandomForest':
        reg = RandomForestRegressor(random_state=int(method_args['arg1']), n_estimators=int(method_args['arg2']))
        cv_model = RandomForestRegressor(random_state=int(method_args['arg1']), n_estimators=int(method_args['arg2']))
    elif method == 'ExtraTrees':
        reg = ExtraTreesRegressor(random_state=int(method_args['arg1']), n_estimators=int(method_args['arg2']))
        cv_model = ExtraTreesRegressor(random_state=int(method_args['arg1']), n_estimators=int(method_args['arg2']))
    elif method == 'MLP':
        reg = MLPRegressor(random_state=int(method_args['arg1']), max_iter=int(method_args['arg2']))
        cv_model = MLPRegressor(random_state=int(method_args['arg1']), max_iter=int(method_args['arg2']))
    else: # KernelRidge
        reg = KernelRidge(alpha=float(method_args['arg1']))
        cv_model = KernelRidge(alpha=float(method_args['arg1']))

    reg.fit(X, y)
    y_predict = reg.predict(X)
    p_name = target_column + '--predicted'

    data = {}

    data[target_column] = y
    data[p_name] = y_predict


    # cross validation
    kf = KFold(shuffle=True, random_state=int(method_args['arg1']), n_splits=folds)
    scoring = {
        'r2': 'r2',
        'mae': 'neg_mean_absolute_error',
    }

    scores = cross_validate(cv_model, X, y, cv=kf, scoring=scoring)
    data['scores'] = scores

    return data, reg
#-------------------------------------------------------------------------------------------------
