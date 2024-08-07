/*=================================================================================================
// Project: CADS/MADS - An Integrated Web-based Visual Platform for Materials Informatics
//          Hokkaido University (2018)
//          Last Update: Q3 2023
// ________________________________________________________________________________________________
// Authors:Yoshiki Hasukawa (Student Developer and Component Design) [2024]
//　　　　　 Mikael Nicander Kuwahara (Lead Developer) [2021-]
// __________________________________________________________________________________________________
// Description: This is the Settings Configuration Form for the 'cads_component_template' View,
//              driven by ReduxForm
// ------------------------------------------------------------------------------------------------
// Notes: 'cads_component_template Form' opens a customized form for the
//        'cads_component_template' visualization component and allows the user to edit its look,
//        feel and behavior in multiple ways.
// ------------------------------------------------------------------------------------------------
// References: React, ReduxForm and semantic-view-ui libs, Needed FormField components, 3rd party
//             lodash lib
=================================================================================================*/

//-------------------------------------------------------------------------------------------------
// Load required libraries
//-------------------------------------------------------------------------------------------------
import React, { useState, useRef, useEffect } from 'react';
import { Field, reduxForm, Label, change } from 'redux-form';
import { Button, Form, Popup, Checkbox, Header } from 'semantic-ui-react';

import SemanticDropdown from '../FormFields/Dropdown';
import Input from '../FormFields/Input';
import SemButtonGroup from '../FormFields/ButtonGroup';
import SemCheckbox from '../FormFields/Checkbox';

import { getDropdownOptions } from './FormUtils';

import { useSelector } from "react-redux";

// import _, { values } from 'lodash';

//-------------------------------------------------------------------------------------------------


//=======================

//=======================
const setSubmitButtonDisable = (disableState) => {
  if (disableState) { $(".ui.positive.button").prop('disabled', true); }
  else{ $(".ui.positive.button").prop('disabled', false); }
}
//=======================

const machineLearningModel = ['Linear', 'Support Vector Regression', 'Random Forest'];
const temperature = [10, 50, 100, 500, 1000];
const selectedDataSourceList = ['Data Management', 'Feature Engineering Component'];

//=======================
const validate = (values, props) => {
  const errors = {};

  // Make sure the correct dataset is loaded
  if (values.selectedDataSource === 'Data Management') {
    const targetColumn = values.targetColumn;
    const testTargetColumn = targetColumn ? !(props.columns.some(column => column.value === targetColumn)) : '';
    if (testTargetColumn) {
      values.targetColumn =  '';
      values.baseDescriptors = [];
      values.descriptorsFileName = "Nothing loaded."
    }
  } else if (values.selectedDataSource === 'Feature Engineering Component') {
    const feId = values.featureEngineeringId
    const feIdBoolean = values.featureEngineeringId ? props.dataset[feId] : true;
    if (!feIdBoolean) {
      values.targetColumn = '';
      values.featureEngineeringId = '';
      values.featureEngineeringDS = {};
      values.featureEngineeringTC = [];
    }
  }
  
  // Validate each Form
  if (!values.machineLearningModel) {
    errors.machineLearningModel = 'Required';
    errors.iterations = 'Model is Requred';
  } else {
      if (values.machineLearningModel === 'Random Forest') {
        if (!values.iterations || values.iterations < 50 || values.iterations > 100) {
          errors.iterations = 'The value must be between 50 and 100 (Random Forest)'
        }
      } else if (values.machineLearningModel === 'Linear' || values.machineLearningModel === 'Support Vector Regression') {
        if (!values.iterations || values.iterations < 100 || values.iterations > 1000) {
          errors.iterations = 'The value must be between 100 and 1000 (Linear, Support Vector Regression)'
        }
      }
    }

  if (!values.temperature) {
    errors.temperature = 'Required';
  }

  if (!values.targetColumn) {
    errors.targetColumn = 'Required';
  }

  //when selectDataSource is Data Management
  if (values.selectedDataSource === 'Data Management') {
    if (values.baseDescriptors && !values.baseDescriptors.length ) {
      errors.baseDescriptors = 'Required';
    }
    setSubmitButtonDisable( errors.machineLearningModel || errors.iterations || errors.temperature || errors.baseDescriptors || errors.targetColumn);
  } else if (values.selectedDataSource === 'Feature Engineering Component') {
    // Validate each Form whenselectDataSource is Feature Engineering Component
    if ( !values.featureEngineeringDS ) {
      errors.featureEngineeringDS = 'Required'
    }
    setSubmitButtonDisable( errors.machineLearningModel || errors.iterations || errors.temperature || errors.featureEngineeringDS || errors.targetColumn);
  }


  return errors;
};
//=======================

//-------------------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------------------
// The ReduxForm Module for this specific view and Visualisation Component
//-------------------------------------------------------------------------------------------------
const MonteCatForm = (props) => {

  // parameters and such
  const {
    handleSubmit,
    initialValues,
    defaultOptions,
    columns,
    pristine,
    reset,
    submitting,
    colorTags,
    change,
  } = props;


  const { views, dataset } = useSelector((state) => ({
    views: state.views,
    dataset: state.dataset,
  }));
  const idFE = views.filter((view) => view.name === 'FeatureEngineering').map((view) => view.id)
  const idHaveData = idFE.filter((id) => dataset.hasOwnProperty(id)).filter((id) => dataset[id])

  initialValues.options = {...defaultOptions, ...(initialValues.options) };

  const fileInputRef = useRef(null);
  const [iterationsMin, setIterationsMin] = useState(null);
  const [iterationsMax, setIterationsMax] = useState(null);
  const [fieldsAreShowing, toggleVisibleFields] = useState(
    initialValues.selectedDataSource != selectedDataSourceList[1]
  );
  const [feId, setFeId] = useState(initialValues.featureEngineeringId);
  const [targetColumnsFE, setTargetColumnsFE] = useState(views.some((view) => view.id === feId) ? views.find((view) => view.id === feId).settings.targetColumns : []);

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    // console.log(file);
    if (file) {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = (e) => {
        const text = e.target.result;
        props.change('baseDescriptors', text.split(/,|\r\n|\n|\r/).filter(Boolean));
        props.change('descriptorsFileName', `${file.name}`);
      };
    }
  };

  const changeModel = (e) => {
    if (e === 'Random Forest') {
      setIterationsMin(50);
      setIterationsMax(100);
    } else {
      setIterationsMin(100);
      setIterationsMax(1000);
    }
  }

  const selectFEId = (e, data) => {
    const selectedView = views.find((view) => view.id === data.value);
    const targetColumns = selectedView.settings.targetColumns;
    props.change('featureEngineeringDS', dataset[data.value]);
    props.change('featureEngineeringId', data.value);
    props.change('featureEngineeringTC', targetColumns)
    props.change('targetColumn', '');
    setFeId(data.value);
    setTargetColumnsFE(targetColumns)
  }

  useEffect(() => {
  if (initialValues.selectedDataSource === 'Feature Engineering Component') {
    props.change('featureEngineeringDS', dataset[feId]);
    props.change('featureEngineeringTC', targetColumnsFE);
    const testTargetFE = targetColumnsFE.includes(initialValues.targetColumn);
    if (!testTargetFE) {
      props.change('targetColumn', '');
    }
  }
  }, [])
  // The form itself, as being displayed in the DOM
  return (
    <Form onSubmit={handleSubmit}>

        <Form.Field> 
          <label>Selected Data Source<Popup trigger={<span style={{fontSize: "20px", color: "blue"}}>ⓘ</span>} content='You can choose to use the Dataset of Data Management or Feature Engineering Component.' size='small' />:</label>
          <Field
            name="selectedDataSource"
            component={SemanticDropdown}
            placeholder="SelectedDataSource"
            options={getDropdownOptions(selectedDataSourceList)}
            onChange={(e, data) => {
              toggleVisibleFields(data != selectedDataSourceList[1])
              props.change('targetColumn', '');
            }}
          />
        </Form.Field>

        {/* These Form Fields are for using Data Management Source */}
        {fieldsAreShowing &&
          <Form.Group>
            <Form.Field width={4}>
              <label>Base Descriptors<Popup trigger={<span style={{fontSize: "20px", color: "blue"}}>ⓘ</span>} content='This file contains a list of the base Descriptor names prior to engineering the different analogues.' size='small' />:</label>
              <Button type="button" onClick={handleClick} style={{width: '100%'}}>Load File</Button>
              <input type="file" ref={fileInputRef} accept=".csv" onChange={handleFileChange} style={{ display: 'none' }}/>
            </Form.Field>

            <Form.Field width={12} style={{marginTop: 'auto'}}>
              <Field 
                name='descriptorsFileName'
                component={Input}
                readOnly
                style={{width: '100%'}}
              />
            </Form.Field>
          </Form.Group>}

        {/* These Form Fields are for using Feature Engineering Source */}
        {!fieldsAreShowing &&
          <Form.Field >
            <label>Feature Engineering Data Source<Popup trigger={<span style={{fontSize: "20px", color: "blue"}}>ⓘ</span>} content='Choose which Feature Engineering Component to use.' size='small' />:</label>
            { ( idHaveData.length === 0 ) ? <label style={{margin:'0px auto'}}>There is no available Feature Engineering Data Source</label> :
              idHaveData.map((id) => {
                return (
                  <Form.Field key={id}>
                    <Checkbox
                      label={'Feature Engineering id :' + id}
                      name='featureEngineeringDS'
                      value={id}
                      checked={feId === id}
                      onChange={(e, data) => selectFEId(e, data)}
                      />
                  </Form.Field>
                  )
              })}
          </Form.Field>}

      <hr />

      <Form.Group >
        <Form.Field width={6}>
        <label>Macine Learning Model<Popup trigger={<span style={{fontSize: "20px", color: "blue"}}>ⓘ</span>} content='Select machine learning model to run MonteCat' size='small' />:</label>
          <Field
            name="machineLearningModel"
            component={SemanticDropdown}
            placeholder="Models"
            options={getDropdownOptions(machineLearningModel)}
            onChange={(e) => {changeModel(e)}}
            search
          />
        </Form.Field>

        <Form.Field width={12}>
          <label>Iterations<Popup trigger={<span style={{fontSize: "20px", color: "blue"}}>ⓘ</span>} content='Enter the number of iterations for the model, limited to 50-100 for RandomForest, 100-1000 for Linear and Support Vector Regression' size='small' />:</label>
          <Field 
            name="iterations"
            component={Input}
            type='number'
            step={1}
            min={iterationsMin}
            max={iterationsMax}
          />
        </Form.Field>
      </Form.Group>

      <hr />

      <Form.Field>
        <label>Target Column<Popup trigger={<span style={{fontSize: "20px", color: "blue"}}>ⓘ</span>} content='When Selected Data Source is Data Management, you can choose Target Column from columns of Data Management. When Selected Data Source is Feature Engineering Component, you can choose from Target Columns of Feature Engineering Component.' size='small' />:</label>
        <Field
          name="targetColumn"
          component={SemanticDropdown}
          placeholder="target column"
          options={fieldsAreShowing ? getDropdownOptions(columns): getDropdownOptions(targetColumnsFE)}
          search
        />
      </Form.Field>

      <hr />

      <Form.Group widths="equal">
        <Form.Field>
            <label>Temperature<Popup trigger={<span style={{fontSize: "20px", color: "blue"}}>ⓘ</span>} content='Temperature parameter used to tune the Acceptance Probability curve behavior' size='small' />:</label>
            <Field 
              name="temperature"
              component={SemButtonGroup}
              buttonList = {temperature}
            />
          </Form.Field>
          <Form.Field>
            <label>Random Seed<Popup trigger={<span style={{fontSize: "20px", color: "blue"}}>ⓘ</span>} content='A specific random seed value can be selected by the user if reproducibility is desired. If not, the outcome will be randomized.' size='small' />:</label>
            <Field 
              name="randomSeed"
              component={SemCheckbox}
              toggle
            />
          </Form.Field>
      </Form.Group>

      <hr />

      <Form.Group widths="equal">
        <label>Extent:</label>
        <Field
          fluid
          name="options.extent.width"
          component={Input}
          placeholder="Width"
        />
        <Field
          fluid
          name="options.extent.height"
          component={Input}
          placeholder="Height"
        />
      </Form.Group>

      <hr />
      <Form.Field>
        <p style={{fontSize: "15px", color: "red"}}>※The Monte Cat process may take a few minutes. Please do not reload the page during the process.</p>
      </Form.Field>


    </Form>
  );
};
//-------------------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------------------
// Exporting and sharing this ReduxForm Module
//-------------------------------------------------------------------------------------------------
export default reduxForm({
  form: 'MonteCat',
  validate,
})(MonteCatForm);
//-------------------------------------------------------------------------------------------------