/*=================================================================================================
// Project: CADS/MADS - An Integrated Web-based Visual Platform for Materials Informatics
//          Hokkaido University (2018)
//          Last Update: Q3 2023
// ________________________________________________________________________________________________
// Authors:Yoshiki Hasukawa (Student Developer and Component Design) [2024]
//　　　　　 Mikael Nicander Kuwahara (Lead Developer) [2021-]
// ________________________________________________________________________________________________
// Description: This is the React Component for the Visualization View of the
//              'FeatureAssignment' module
// ------------------------------------------------------------------------------------------------
// Notes: 'featureAssignment' is a component that makes amazing things.
// ------------------------------------------------------------------------------------------------
// References: React & prop-types Libs, 3rd party jquery, internal support methods fr. VisCompUtils
=================================================================================================*/

//-------------------------------------------------------------------------------------------------
// Load required libraries
//-------------------------------------------------------------------------------------------------
import React, { useState, useEffect, useRef } from "react";
import { Button, Header, Grid, GridRow, Modal, ModalActions, ModalContent, ModalHeader ,Table, GridColumn, Image, Loader, Dimmer } from 'semantic-ui-react'
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import $ from "jquery";

import csvinput from './images/featureAssignment/csvinput.png';
import csvoutput from './images/featureAssignment/csvoutput.png';
//-------------------------------------------------------------------------------------------------


//-------------------------------------------------------------------------------------------------
// Default Options / Settings
//-------------------------------------------------------------------------------------------------
const defaultOptions = {
  title: "Empty 'featureAssignment' Component",
  extent: { width: undefined, height: undefined },
};

//-------------------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------------------
// This Visualization Component Creation Method
//-------------------------------------------------------------------------------------------------
export default function FeatureAssignment({
  data,
  mappings,
  options,
  colorTags,
  originalOptions,
  id,
  conversionMethod,
}) {
  let internalOptions = {...defaultOptions, ...options};

  //function to manage state of each buttons
  const manageButton= (saBoolean, waaBoolean, wabBoolean) => {
    setsaDisabled(saBoolean);
    setwaaDisabled(waaBoolean);
    setwabDisabled(wabBoolean);
  }

  const [saDisabled, setsaDisabled] = useState(true); // manage button of simple average
  const [waaDisabled, setwaaDisabled] = useState(true); // manage button of weighted average format A
  const [wabDisabled, setwabDisabled] = useState(true); // manage button of weighted average format B
  const [currentDataSource, setCurrentDataSource] = useState({id: '', name: ''}); //manage data souerce change

  try {
    const availableDataSources = useSelector((state) => state.dataSources);
    if (availableDataSources.selectedDataSource != currentDataSource.id) {
      if(currentDataSource.id != '') {
        // manageButton(true, true, true);
      }
      setCurrentDataSource({id: availableDataSources.selectedDataSource, name: ((availableDataSources.items.find(item => availableDataSources.selectedDataSource == item.id)).name)})
    }
  } catch (error) { /*Just ignore and move on*/ }
  
  // Create the VizComp based on the incomming parameters
  const createChart = () => {
    if (data.data) {
      if (conversionMethod === 'Simple Average') {
        manageButton(false, true, true);
      } else if (conversionMethod === 'Weighted Average (Format A)') {
        manageButton(true, false, true);
      } else {
        manageButton(true, true, false);
      }
    }
  }

   // Clear away the VizComp
   const clearChart = () => {
    /* Called when component is deleted */
  };

  // Only called at init and set our final exit function
  useEffect(() => {
    return () => { clearChart(); };
  }, []);

  // Recreate the chart if the data and settings change
  useEffect(() => {
    createChart();
  }, [data, options]);

  // Add the VizComp to the DOM
  return (
    <div style={{width: internalOptions.extent.width, height: internalOptions.extent.height, overflow: 'hidden', boxSizing: 'border-box'}}>
      <Header as='h2' style={{margin:'15px auto 30px auto', textAlign:'center'}}>Feature Assignment( id: {id})</Header>
      <DataItemActions data={data} conversionmethod={conversionMethod} disabled={saDisabled} name={'Simple Average'}/>
      <DataItemActions data={data} conversionmethod={conversionMethod} disabled={waaDisabled} name={'Format A'}/>
      <DataItemActions data={data} conversionmethod={conversionMethod} disabled={wabDisabled} name={'Format B'}/>
      <CSVFileModal image={csvinput} title={'Input CSV File Data Requirements Format'} attr={'#inputcsvfile' + id}/>
      <CSVFileModal image={csvoutput} title={'Output CSV File Data Format'} attr={'#outputcsvfile' + id}/>
    </div>
  );
}
//-------------------------------------------------------------------------------------------------

//Modal component of csv file format and csv file output
const CSVFileModal = ({image, title, attr}) => {
  const [open, setOpen] = useState(false);
  const rootNode = useRef(null);

  useEffect(() => {
    const viewWrapperCustomButton = $(rootNode.current).parent().parent().parent().find(attr);
    viewWrapperCustomButton.off('click');
    viewWrapperCustomButton.on( "click", function () {
      setOpen(true);
    })
    return () => { viewWrapperCustomButton.off('click'); }
  }, [])

  return (
    <div>
      <Modal
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        open={open}
        // trigger={<Button size="mini" style={{margin:'15px 0.5em 30px 0px'}} color='red'>ⓘ</Button>}
        centered
        size="large"
      >
        <ModalHeader >{title}</ModalHeader>
        <ModalContent image style={{ display: 'flex', justifyContent: 'center' }}>
          <Image size='huge' src={image} wrapped />
        </ModalContent>
        <ModalActions>
          <Button negative onClick={() => setOpen(false)}>Close</Button>
        </ModalActions>
      </Modal>
      <div ref={rootNode} />
    </div>
  )
}

//Dawnload and view button Component
const DataItemActions = ({data, conversionmethod, disabled, name}) => {

  const [open, setOpen] = useState(false);

  //Buttun Clicked Funtuion
  const downloadButtonClick = (e, value) => {
    const {conversionmethod} = value

    //generate csv dataset
    // console.log(value);
    // console.log(data);
    let csv = data.header.join(',') + '\n';
    Object.keys(data.data).forEach(key => {
      csv += data.data[key].join(',') + '\n';
      });
    // console.log(csv)
    
    //fileName
    const fileName =  conversionmethod === 'Simple Average' ? 'simple_averages.csv' : conversionmethod === 'Weighted Average (Format A)' ? 
    'weighted_average_A' : 'weighted_average_B';
    // console.log(fileName)

    //Download 
    const link = document.createElement("a");
    link.setAttribute("href", 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    link.setAttribute("target", "_blank");
    link.setAttribute("download", fileName);
    link.click();
    try {
      document.body.removeChild(link)
    } catch (error) {}
  }

  return (
    <Grid >
      <GridRow columns={3} centered>
        <GridColumn textAlign={'center'} verticalAlign={"middle"}>
          <Header as='h4'>{name}</Header>          
        </GridColumn>
        <GridColumn textAlign={'justified'} verticalAlign={"middle"}>
          <Button 
            disabled={disabled}
            onClick={(e, value) => {downloadButtonClick(e, value)}}
            conversionmethod = {conversionmethod}
          >Download
          </Button>
        </GridColumn>
        <GridColumn textAlign={'justified'} verticalAlign={"middle"}>
          <Modal
            basic
            onClose={() => setOpen(false)}
            onOpen={() => setOpen(true)}
            open={open}
            trigger={<Button 
                      disabled={disabled}
                      type="button"
                      >View
                    </Button>}
            centered
            size="fullscreen"
          >
            <ModalContent  scrolling>
              <ViewTable dataset = {data}/>
            </ModalContent>
            <ModalActions>
              <Button negative onClick={() => setOpen(false)}>Close</Button>
            </ModalActions>
          </Modal>
        </GridColumn>
      </GridRow> 
    </Grid>
  )
}


//This is a component which show result data as table
const ViewTable = ({dataset}) => {
  // console.log(dataset)
  const { header, data } = dataset;
  const [isLoading, setIsLoadting] = useState(true);

  useEffect(() => {
    let timeoutId = setTimeout(() => {
      setIsLoadting(false)
    }, 50);
    return () => {
      clearTimeout(timeoutId);
    }
  }, []);

  return (
    <div>
      {isLoading ? (
        <Dimmer active>
          <Loader indeterminate>Preparing Table</Loader>
        </Dimmer>
      ): (
        <Table celled compact>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>#</Table.HeaderCell>
              {header.map((cell, index) => (
                <Table.HeaderCell key={index}>{cell}</Table.HeaderCell>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {Object.keys(data).map((key) => (
              <Table.Row key={key}>
                <Table.Cell>{key}</Table.Cell>
                {data[key].map((cell, cellIndex) => (
                  <Table.Cell key={cellIndex}>{cell}</Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </div>
  )
}

//-------------------------------------------------------------------------------------------------
// This Visualization Component's Allowed and expected Property Types
//-------------------------------------------------------------------------------------------------
FeatureAssignment.propTypes = {
  data: PropTypes.shape({ }),
  conversionMethod: PropTypes.string,
  catalyst: PropTypes.array,
  targetColumns: PropTypes.array,
  compositionColumns: PropTypes.array,
  options: PropTypes.shape({
    extent: PropTypes.shape({
      width: PropTypes.number,
      height: PropTypes.number,
    }),
  }),
};
//-------------------------------------------------------------------------------------------------


//-------------------------------------------------------------------------------------------------
// This Visualization Component's default initial start Property Values
//-------------------------------------------------------------------------------------------------
FeatureAssignment.defaultProps = {
  data: {},
  conversionMethod: '',
  catalyst: [],
  targetColumns: [],
  compositionColumns: [],
  options: defaultOptions,
};
//-------------------------------------------------------------------------------------------------
