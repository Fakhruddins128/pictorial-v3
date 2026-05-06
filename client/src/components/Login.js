import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button, Alert, Form as BootstrapForm } from "react-bootstrap";

const LoginSchema = Yup.object().shape({
  username: Yup.string().required("Username is required"),
  password: Yup.string().required("Password is required"),
});

const LoginForm = ({ onSubmit, error }) => {
  return (
    <Formik
      initialValues={{ username: "", password: "" }}
      validationSchema={LoginSchema}
      onSubmit={onSubmit}
    >
      {({ isSubmitting }) => (
        <Form as={BootstrapForm} className="mb-3">
          {error && <Alert variant="danger">{error}</Alert>}

          <BootstrapForm.Group className="mb-3">
            <BootstrapForm.Label>Username</BootstrapForm.Label>
            <Field
              as={BootstrapForm.Control}
              type="text"
              name="username"
              placeholder="Enter username"
            />
            <ErrorMessage name="username" component={Alert} variant="danger" />
          </BootstrapForm.Group>

          <BootstrapForm.Group className="mb-3">
            <BootstrapForm.Label>Password</BootstrapForm.Label>
            <Field
              as={BootstrapForm.Control}
              type="password"
              name="password"
              placeholder="Password"
            />
            <ErrorMessage name="password" component={Alert} variant="danger" />
          </BootstrapForm.Group>

          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting}
            className="w-100"
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </Button>
        </Form>
      )}
    </Formik>
  );
};

export default LoginForm;
