/*=================================================================================================
// Project: CADS/MADS - An Integrated Web-based Visual Platform for Materials Informatics
//          Hokkaido University (2018)
// ________________________________________________________________________________________________
// Authors: Jun Fujima (Former Lead Developer) [2018-2021]
//          Mikael Nicander Kuwahara (Current Lead Developer) [2021-]
// ________________________________________________________________________________________________
// Description: This is the Redux Component for the 'CmvBase' feature/module
// ------------------------------------------------------------------------------------------------
// Notes: 'CmvBase' is the main workspace area of the analysis page that provides us with
//        possibilities that allows us to add different views (visualization components) in order
//        to study the selected data.
// ------------------------------------------------------------------------------------------------
// References: React, prop-types Libs, ColorTags and AddView Containers,
//             and ViewCatalog (available vizualisation components)
=================================================================================================*/

//-------------------------------------------------------------------------------------------------
// Load required libraries
//-------------------------------------------------------------------------------------------------
import React from 'react';
import PropTypes from 'prop-types';

import ColorTags from '../../containers/ColorTags';
import AddViewButton from '../../containers/AddView';
import config from '../Views/ViewCatalog';

import './style.css';

//-------------------------------------------------------------------------------------------------

// *** TODO *** TRYING TO IMPLEMENT MOVABLE VIEWS
// import { Responsive, WidthProvider } from "react-grid-layout" //*** TODO: movable views
// import GridLayout from "react-grid-layout"
import { Responsive, WidthProvider } from "react-grid-layout"
import "react-grid-layout/css/styles.css"; //*** TODO: movable views
import "react-resizable/css/styles.css"; //*** TODO: movable views
// const ResponsiveReactGridLayout = WidthProvider(Responsive) //*** TODO: movable views


const ResponsiveGridLayout = WidthProvider(Responsive);
let viewCounter = 1;

function goForIt(layout){
  console.warn("layout changed");
  console.warn(layout);
}

function letsGoForItAgain(ItemCallback){
  console.warn("stopped resize");
  console.warn(ItemCallback);
}



//-------------------------------------------------------------------------------------------------
// The Component Class
//-------------------------------------------------------------------------------------------------
class CmvBase extends React.Component {
  static propTypes = {
    views: PropTypes.arrayOf(PropTypes.any),
    actions: PropTypes.objectOf(PropTypes.any),
    dataset: PropTypes.objectOf(PropTypes.any),
    selection: PropTypes.arrayOf(PropTypes.number),
    colorTags: PropTypes.arrayOf(PropTypes.any),
  };

  static defaultProps = {
    views: [],
    actions: {},
    dataset: {},
    selection: [],
    colorTags: [],
  };

  componentDidMount() {}

  render() {
    const {
      views,
      actions,
      dataset,
      selection,
      colorTags,
      userInfo,
      showMessage,
    } = this.props;

    const viewContainers = views.map((view) => {
      const componentDef = config.find((c) => view.type === c.type);
      if(componentDef){
        const View = componentDef.component;

        const CustomGridItemComponent = React.forwardRef(
          ({style, className, ...props}, ref) => {
            return (
              <div style={{ ...style}} className={className} ref={ref}>
                {/* Some other content */}
                aaaaa
                <View
                  key={view.id}
                  data-grid={{x: 0, y: 0, w: 1, h: 1}}
                  id={view.id}
                  view={view}
                  dataset={dataset}
                  selection={selection}
                  colorTags={colorTags}
                  removeView={actions.removeViewData}
                  updateView={actions.updateView}
                  updateSelection={actions.updateSelection}
                  actions={actions}
                  isLoggedIn={userInfo.isLoggedIn}
                  version={componentDef.version}
                  devStage={componentDef.devStage}
                />
              </div>
            );
          }
        );

        return (
          // <div style={{border: '2px solid red', backgroundColor: 'yellow', padding: "10px"}} data-grid={{x: 0, y: 0, w: 1, h: 1}} key={view.id}>
            <CustomGridItemComponent
              key={view.id}
              // data-grid={{x: 0, y: 0, w: 1, h: 1}}
              // id={view.id}
              // view={view}
              // dataset={dataset}
              // selection={selection}
              // colorTags={colorTags}
              // removeView={actions.removeViewData}
              // updateView={actions.updateView}
              // updateSelection={actions.updateSelection}
              // actions={actions}
              // isLoggedIn={userInfo.isLoggedIn}
              // version={componentDef.version}
              // devStage={componentDef.devStage}
            />
          // </div>
        );
      }
    });

    return (
      <div>
        <div className="base-container">
          <ColorTags />
          <AddViewButton views={views} />
        </div>

        <div className="ui divider" />

        <ResponsiveGridLayout className="layout"
          breakpoints={{lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0}} rowHeight={50} cols={{lg: 12, md: 10, sm: 6, xs: 4, xxs: 2}}
          compactType={'horizontal'} style={{border: '4px solid blue'}} autoSize={true} onLayoutChange={goForIt} onResizeStop={letsGoForItAgain}>
          {viewContainers}
          {/* <div style={{border: '2px solid red', backgroundColor: 'pink'}} data-grid={{x: 0, y: 0, w: 1, h: 1}} key="1">1</div> */}
          {/* <div style={{border: '2px solid blue', backgroundColor: 'purple'}} data-grid={{x: 0, y: 0, w: 1, h: 1}} key="2">2</div> */}
          {/* <div style={{border: '2px solid green', backgroundColor: 'orange'}} data-grid={{x: 0, y: 0, w: 1, h: 1}} key="17">Fake</div> */}
          {/* <div style={{border: '2px solid salmon', backgroundColor: 'brown'}} data-grid={{x: 0, y: 0, w: 1, h: 1}} key="4">4</div> */}
          {/* <div style={{border: '2px solid brown', backgroundColor: 'red'}} data-grid={{x: 0, y: 0, w: 1, h: 1}} key="5">5</div> */}
        </ResponsiveGridLayout>

        {/* <GridLayout className="layout" cols={12} rowHeight={30} width={1200}>
          <div style={{border: '2px solid red'}} key="a" data-grid={{x: 0, y: 0, w: 1, h: 2, static: false}}>a</div>
          <div style={{border: '2px solid blue'}} key="b" data-grid={{x: 1, y: 0, w: 3, h: 2, minW: 2, maxW: 4}}>b</div>
          <div style={{border: '2px solid green'}} key="c" data-grid={{x: 4, y: 0, w: 1, h: 2}}>c</div>
        </GridLayout> */}

        {/* FORTEST: [style={{border: '4px solid blue'}}]  */}
        {/* <div className="base-container" style={{border: '4px solid blue'}}>
          {viewContainers}
          <AddViewButton views={views} />
        </div> */}
      </div>
    );
  }
}
//-------------------------------------------------------------------------------------------------

export default CmvBase;
