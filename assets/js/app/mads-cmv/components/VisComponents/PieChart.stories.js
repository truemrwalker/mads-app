import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import _ from 'lodash';

import PieChart from './PieChart';

// Simple Test Data - SETUP BEGIN
//=========================================
const originalTestData = {
  'United States': 157,
  'United Kingdom': 93,
  Japan: 89,
  China: 63,
  Germany: 44,
  India: 42,
  Italy: 40,
  Australia: 35,
  Brazil: 32,
  France: 31,
  Taiwan: 31,
  Spain: 29,
};

const countries = [];
const scores = [];
for (let key in originalTestData) {
  countries.push(key);
  scores.push(originalTestData[key]);
}
const data =  { countries, scores }
//=========================================
// Simple Test Data - SETUP END

// Small File Sample Data - SETUP BEGIN
//=========================================
import sampledata from './testdata/data-ex';
const sgc = {};
sampledata.forEach(item => {
  let sg = item.Spacegroup;
  if(!sgc[sg]){ sgc[sg] = 1; }
  else { sgc[sg]++; }
});
const sgData =  { dimensions: [], values: [] };
for (let key in sgc) {
  sgData.dimensions.push(key);
  sgData.values.push(sgc[key]);
}
//=========================================
// Small File Sample Data - SETUP END

// Bigger File Sample Data - SETUP BEGIN
//=========================================
import biggersampledata from './testdata/response-ex';
const sgc2 = {};
biggersampledata.data.forEach(item => {
  let sg = item.Spacegroup;
  if(!sgc2[sg]){ sgc2[sg] = 1; }
  else { sgc2[sg]++; }
});
const bsgData =  { dimensions: [], values: [] };
for (let key in sgc2) {
  bsgData.dimensions.push(key);
  bsgData.values.push(sgc2[key]);
}
//=========================================
// Bigger File Sample Data - SETUP END

// Numeric Chem File Data - SETUP BEGIN
//=========================================
import numericchemdata from './testdata/chem';
const cData =  { dimensions: _.range(10).map((num) => { return num * 10 + "% - " + ((num * 10) + 10) + "%"; }), values: Array(10).fill(0) };
numericchemdata.data.forEach(item => {
  let sg = item['CH4-Conversion%'];
  cData.values[Math.floor(sg/10)]++;
});
//=========================================
// Numeric Chem File Data - SETUP END

const stories = storiesOf('PieChart', module);

stories
  .add('...empty', () => <PieChart />)
  .add('...with small data', () => (
    <PieChart
      data = {data}
      mappings={{ dimensions: 'countries', values: 'scores' }}
      options = {{title: "Scores per Country"}}
    />
  ))
  .add('...with file data', () => (
    <PieChart
       data = {sgData}
       options = {{title: "The composition of all categories in the column of SpaceGroup in small sample Material Data"}}
    />
  ))
  .add('...with bigger file data', () => (
    <PieChart
       data = {bsgData}
       options = {{title: "The composition of all categories in the column of SpaceGroup in larger sample Material Data"}}
    />
  ))
  .add('...with numerical chem data', () => (
    <PieChart
       data = {cData}
       options = {{title: "The composition of 10 categories in the column of CH4-Conversion% in sample Material Data"}}
    />
  ));