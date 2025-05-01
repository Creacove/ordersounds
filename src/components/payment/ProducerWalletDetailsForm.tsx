import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

// Define the schema
const ProducerWalletDetailsSchema = Yup.object().shape({
  producerId: Yup.string().required('Producer ID is required'),
  walletAddress: Yup.string().required('Wallet address is required'),
});

interface ProducerWalletDetailsForm {
  producerId: string;
  walletAddress: string;
  onSuccess?: () => void;
}

interface ProducerWalletDetailsFormProps {
  onSubmit: (values: ProducerWalletDetailsForm) => void;
}

const ProducerWalletDetailsForm: React.FC<ProducerWalletDetailsFormProps> = ({ onSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Formik
      initialValues={{
        producerId: '',
        walletAddress: '',
        
      }}
      validationSchema={ProducerWalletDetailsSchema}
      onSubmit={(values, { setSubmitting }) => {
        setIsSubmitting(true);
        onSubmit(values);
        setSubmitting(false);
      }}
    >
      {({ values, handleChange, handleSubmit, isSubmitting }) => (
        <Form>
          <div className="form-group">
            <label htmlFor="producerId">Producer ID</label>
            <Field
              type="text"
              id="producerId"
              name="producerId"
              value={values.producerId}
              onChange={handleChange}
            />
            <ErrorMessage name="producerId" component="div" />
          </div>

          <div className="form-group">
            <label htmlFor="walletAddress">Wallet Address</label>
            <Field
              type="text"
              id="walletAddress"
              name="walletAddress"
              value={values.walletAddress}
              onChange={handleChange}
            />
            <ErrorMessage name="walletAddress" component="div" />
          </div>

          {/* Add more form fields as needed */}

          <button type="submit" disabled={isSubmitting}>
            Submit
          </button>
        </Form>
      )}
    </Formik>
  );
};

export default ProducerWalletDetailsForm;