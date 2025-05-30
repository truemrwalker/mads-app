/*=================================================================================================
// Project: CADS/MADS - An Integrated Web-based Visual Platform for Materials Informatics
//          Hokkaido University (2018)
//          Last Update: Q2 2025
// ________________________________________________________________________________________________
// Authors: Philippe Gantzer [2024-]
//          Pavel Sidorov [2024-]
// ________________________________________________________________________________________________
// Description: This is the Inner workings and Content Manager Controler of the 'Optimizer' View
// ------------------------------------------------------------------------------------------------
// Notes: 'Optimizer' is the manager of all current input that controls the final view of the
//         'OptimizerVis' visualization component.
// ------------------------------------------------------------------------------------------------
// References: 3rd party pandas & lodash libs, Internal ViewWrapper & Form Utility Support,
//             Internal PieChart & PieForm libs,
=================================================================================================*/

//-------------------------------------------------------------------------------------------------
// Load required libraries
//-------------------------------------------------------------------------------------------------
import { DataFrame } from 'pandas-js';
import _ from 'lodash';

import withCommandInterface from './ViewWrapper';
import convertExtentValues from './FormUtils';

import OptimizerVis from '../VisComponents/OptimizerVis';
import OptimizerForm from './OptimizerForm';

//-------------------------------------------------------------------------------------------------


//-------------------------------------------------------------------------------------------------
// Custom Settings to pass to the VisComp
//-------------------------------------------------------------------------------------------------
const settings = {
  options: { title: 'Optimizer (Regression)' },
};
//-------------------------------------------------------------------------------------------------


//-------------------------------------------------------------------------------------------------
// The View Class for this Visualization Component
//-------------------------------------------------------------------------------------------------
export default class OptimizerView extends withCommandInterface( OptimizerVis, OptimizerForm, settings ) {
  // Manages config settings changes (passed by the connected form) in the view
  handleSubmit = (values) => {
    const { id, view, colorTags, actions, dataset, updateView } = this.props;
    let newValues = { ...values };

    // filter out non-existing columns & colorTags
    if (values.filter) {
      const colorTagIds = colorTags.map((c) => c.id);
      const filteredFilters = values.filter.filter((f) =>
        colorTagIds.includes(f)
      );
      newValues.filter = filteredFilters;
    }

    // filter out featureColumns
    const columns = this.getColumnOptionArray();
    if (values.featureColumns) {
      const filteredColumns = values.featureColumns.filter((f) =>
        columns.includes(f)
      );
      newValues.featureColumns = filteredColumns;
    }

    // filter out numericalFeatureColumns
    if (values.numericalFeatureColumns && values.numericalFeatureColumns.length > 0) {
      const filteredColumns2 = values.numericalFeatureColumns.filter((f) =>
        columns.includes(f)
      );
      newValues.numericalFeatureColumns = filteredColumns2;
    }

    // extract data
    const data = {};
    const df = new DataFrame(dataset.main.data);
    const tc = df.get(newValues.targetColumn);
    data[newValues.targetColumn] = tc.values.toArray();
    const fc = df.get(newValues.featureColumns);
    newValues.featureColumns.forEach((c) => {
      const fc = df.get(c);
      data[c] = fc.values.toArray();
    });
    if(values.numericalFeatureColumns && values.numericalFeatureColumns.length > 0) {
      const nfc = df.get(newValues.numericalFeatureColumns);
      newValues.numericalFeatureColumns.forEach((c) => {
        const nfc = df.get(c);
        data[c] = nfc.values.toArray();
      });
    };
    if(values.solventColumn) {
      const sc = df.get(newValues.solventColumn);
      data[newValues.solventColumn] = sc.values.toArray();
    };

    // set mapping
    newValues.mappings = {
      x: values.targetColumn,
      y: `${values.targetColumn}--Predicted`,
    };
    newValues = convertExtentValues(newValues);

    actions.sendRequestViewUpdate(view, newValues, data);
  };

  // Manages Save Model Requests
  handleModelSave = async (name, overwrite, id) => {
    const { actions, dataset, view, data } = this.props;

    if(dataset[this.props.id] && dataset[this.props.id]['params']) {
      actions.setLoadingState(true)
      let newValues, data, params, tmpViewParams;
      newValues = view.settings
      data = dataset[this.props.id].data.data
      view['params'] = dataset[this.props.id]['params'];
      tmpViewParams = { view, newValues, data }
      const a = await actions.saveModel(name, tmpViewParams, overwrite, id);
      actions.setLoadingState(false)
      this.close()
    }
    else {
      actions.showMessage({
          header: 'MODEL NOT OPTIMIZED',
          content: 'The model is not optimized yet and cannot be saved. Please submit the module first.',
          type: 'warning',
        });
    }
  };

  composeSubmittingData = (values) => {};

  // Manages data changes in the view
  mapData = (dataset) => {
    const { id, view, actions } = this.props;
    const data = {data_desc: [], d1: {data: []}, d2: {data: [], first_test: 0}};

    if (dataset[id]) {
      const targetName = view.settings.targetColumn;
      const pName = `${targetName}--Predicted`;
      let xx, yy, yyu, xx2, yy2;

      // Make sure backwards compability is implemented so old regression components will still work
      if(dataset[id]['d1']){
        xx = dataset[id]['d1'][targetName];
        yy = dataset[id]['d1'][pName];
        yyu = dataset[id]['d1'][pName+'_uncertain'];
        xx2 = dataset[id]['d2'][targetName];
        yy2 = dataset[id]['d2'][pName];
      }
      else if(dataset[id][targetName]){
        xx = dataset[id][targetName];
        yy = dataset[id][pName];
        xx2 = [];
        yy2 = [];
      }

      if (xx == undefined || !Array.isArray(xx) || yy == undefined || !Array.isArray(yy)) {
        return  {};
      }

      xx.forEach((x, i) => {
        const item = {};
        item[targetName] = x;
        item[pName] = yy[i];
        item[pName + '_uncertain'] = yyu ? yyu[i] : 0;
        data.d1.data.push(item);
      });

      xx2.forEach((x, i) => {
        const item = {};
        item[targetName] = x;
        item[pName] = yy2[i];
        data.d2.data.push(item);
      });
      data.d2.first_test = dataset[id]['first_test']

      if (!(dataset.main.schema.fields.some(e => e.name === this.props.view.settings.targetColumn))) {
        data.d1 = {data: []};
        data.d2 = {data: [], first_test: []};
        data["resetRequest"] = true;
        data["resetTitle"] = "Optimizer";
      }

      if (dataset[id].scores) {
        data["scores"] = dataset[id].scores;
      }

      if (dataset[id].params) {
        data["params"] = dataset[id].params;
      }
    }

    return data;
  };
}
//-------------------------------------------------------------------------------------------------
