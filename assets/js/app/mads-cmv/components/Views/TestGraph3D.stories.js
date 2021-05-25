import React from 'react';
import { storiesOf } from '@storybook/react'; // eslint-disable-line import/no-extraneous-dependencies
import { action } from '@storybook/addon-actions'; // eslint-disable-line import/no-extraneous-dependencies
import {
  // eslint-disable-line import/no-extraneous-dependencies
  withKnobs,
  // array,
} from '@storybook/addon-knobs';

import TestGraph3D from './TestGraph3D';

const stories = storiesOf('TestGraph3D', module);
stories.addDecorator(withKnobs);

stories.add('empty bar chart', () => <TestGraph3D />);
