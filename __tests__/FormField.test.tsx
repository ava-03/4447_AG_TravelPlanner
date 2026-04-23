import React from 'react';
import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import FormField from '../components/FormField';

describe('FormField', () => {
  it('renders label and placeholder and fires onChangeText', () => {
    const onChangeText = jest.fn();

    const { getByText, getByPlaceholderText } = render(
      <FormField
        label="Trip Name"
        placeholder="Enter trip name"
        value=""
        onChangeText={onChangeText}
      />
    );

    expect(getByText('Trip Name')).toBeTruthy();
    expect(getByPlaceholderText('Enter trip name')).toBeTruthy();

    fireEvent.changeText(
      getByPlaceholderText('Enter trip name'),
      'Thailand Trip'
    );

    expect(onChangeText).toHaveBeenCalledWith('Thailand Trip');
  });
});