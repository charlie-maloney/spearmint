/* ------------------------------ Action Types ------------------------------ */

export const actionTypes = {
  TOGGLE_REACT: 'TOGGLE_REACT',

  ADD_DESCRIBE_BLOCK: 'ADD_DESCRIBE_BLOCK',
  DELETE_DESCRIBE_BLOCK: 'DELETE_DESCRIBE_BLOCK',

  ADD_ITSTATEMENT: 'ADD_ITSTATEMENT',

  UPDATE_STATEMENTS_ORDER: 'UPDATE_STATEMENTS_ORDER',
  UPDATE_DESCRIBE_TEXT: 'UPDATE_DESCRIBE_TEXT',

  ADD_ACTION: 'ADD_ACTION',
  DELETE_ACTION: 'DELETE_ACTION',
  UPDATE_ACTION: 'UPDATE_ACTION',

  ADD_ASSERTION: 'ADD_ASSERTION',
  DELETE_ASSERTION: 'DELETE_ASSERTION',
  UPDATE_ASSERTION: 'UPDATE_ASSERTION',

  ADD_RENDER: 'ADD_RENDER',
  DELETE_RENDER: 'DELETE_RENDER',
  UPDATE_RENDER_COMPONENT: 'UPDATE_RENDER_COMPONENT',

  ADD_PROP: 'ADD_PROP',
  DELETE_PROP: 'DELETE_PROP',
  UPDATE_PROP: 'UPDATE_PROP',

  UPDATE_ITSTATEMENT_TEXT: 'UPDATE_ITSTATEMENT_TEXT',
  DELETE_ITSTATEMENT: 'DELETE_ITSTATEMENT',

  CREATE_NEW_TEST: 'CREATE_NEW_TEST',
};

/* --------------------------------- Actions -------------------------------- */

export const addDescribeBlock = () => {
  return {
    type: actionTypes.ADD_DESCRIBE_BLOCK
  }
};

export const deleteDescribeBlock = (describeId) => {
  return {
    type: actionTypes.DELETE_DESCRIBE_BLOCK,
    describeId,  
  }
};

export const addItstatement = (describeId) => ({
  type: actionTypes.ADD_ITSTATEMENT,
  describeId,
});

export const deleteItStatement = (describeId, itId) => ({
  type: actionTypes.DELETE_ITSTATEMENT,
  describeId,
  itId
});

export const toggleReact = () => ({
  type: actionTypes.TOGGLE_REACT,
});

export const updateStatementsOrder = draggableStatements => ({
  type: actionTypes.UPDATE_STATEMENTS_ORDER,
  draggableStatements,
});

export const updateDescribeText = (text, describeId) => ({
  type: actionTypes.UPDATE_DESCRIBE_TEXT,
  text,
  describeId
});

export const addAction = (describeId, itId) => ({
  type: actionTypes.ADD_ACTION,
  describeId,
  itId
});

export const deleteAction = statementId => ({
  type: actionTypes.DELETE_ACTION,
  statementId,
});

export const updateAction = ({
  id,
  eventType,
  eventValue,
  queryVariant,
  querySelector,
  queryValue,
  suggestions,
}) => ({
  type: actionTypes.UPDATE_ACTION,
  id,
  eventType,
  eventValue,
  queryVariant,
  querySelector,
  queryValue,
  suggestions,
});

export const addAssertion = (describeId, itId) => ({
  type: actionTypes.ADD_ASSERTION,
  describeId,
  itId
});

export const deleteAssertion = statementId => ({
  type: actionTypes.DELETE_ASSERTION,
  statementId,
});

export const updateAssertion = ({
  id,
  queryVariant,
  querySelector,
  queryValue,
  isNot,
  matcherType,
  matcherValue,
  suggestions,
}) => ({
  type: actionTypes.UPDATE_ASSERTION,
  id,
  queryVariant,
  querySelector,
  queryValue,
  isNot,
  matcherType,
  matcherValue,
  suggestions,
});

export const addRender = (describeId, itId) => ({
  type: actionTypes.ADD_RENDER,
  describeId,
  itId
});

export const deleteRender = statementId=> ({
  type: actionTypes.DELETE_RENDER,
  statementId,
});

export const updateRenderComponent = (componentName, filePath) => ({
  type: actionTypes.UPDATE_RENDER_COMPONENT,
  componentName,
  filePath,
});

export const addProp = statementId => ({
  type: actionTypes.ADD_PROP,
  statementId,
});

export const deleteProp = (statementId, id) => {
  return {
    type: actionTypes.DELETE_PROP,
    id,
    statementId,
  };
};

export const updateProp = (statementId, id, propKey, propValue) => ({
  type: actionTypes.UPDATE_PROP,
  id,
  statementId,
  propKey,
  propValue,
});

export const updateItStatementText = (text, itId) => ({
  type: actionTypes.UPDATE_ITSTATEMENT_TEXT,
  itId,
  text,
})

export const createNewTest = () => ({
  type: actionTypes.CREATE_NEW_TEST,
});
