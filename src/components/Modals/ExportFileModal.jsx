import React, { useState, useContext } from 'react';
import ReactModal from 'react-modal';
import { GlobalContext } from '../../context/reducers/globalReducer';
import {
  displayFileCode,
  loadProject,
  toggleFolderView,
  highlightFile,
} from '../../context/actions/globalActions';
import { ReactTestCaseContext } from '../../context/reducers/reactTestCaseReducer';
import { ReduxTestCaseContext } from '../../context/reducers/reduxTestCaseReducer';
import { HooksTestCaseContext } from '../../context/reducers/hooksTestCaseReducer';
import { MockDataContext } from '../../context/reducers/mockDataReducer';
import { EndpointTestCaseContext } from '../../context/reducers/endpointTestCaseReducer';
import { PuppeteerTestCaseContext } from '../../context/reducers/puppeteerTestCaseReducer';
import styles from './ExportFileModal.module.scss';

const remote = window.require('electron').remote;
const fs = remote.require('fs');
const path = remote.require('path');
const beautify = remote.require('js-beautify');

const ExportFileModal = ({ isExportModalOpen, setIsExportModalOpen }) => {
  const [fileName, setFileName] = useState('');
  const [invalidFileName, setInvalidFileName] = useState(false);
  const [{ projectFilePath }, dispatchToGlobal] = useContext(GlobalContext);
  const [reactTestCase] = useContext(ReactTestCaseContext);
  const [reduxTestCase] = useContext(ReduxTestCaseContext);
  const [hooksTestCase] = useContext(HooksTestCaseContext);
  const [{ mockData }] = useContext(MockDataContext);
  const [endpointTestCase] = useContext(EndpointTestCaseContext);
  const [puppeteerTestCase] = useContext(PuppeteerTestCaseContext);

  let testFileCode = 'import React from "react";';

  const handleChangeFileName = e => {
    setFileName(e.target.value);
    setInvalidFileName(false);
  };

  /* cancel export file (when false) */
  const closeExportModal = () => {
    setIsExportModalOpen(false);

    // reset fileName and invalidFileName
    setInvalidFileName(false);
    setFileName('');
  };

  const handleClickSave = () => {
    // file name uniqueness check
    if (fs.existsSync(projectFilePath + `/__tests__/${fileName}.test.js` )) {
      setInvalidFileName(true)
      return
    }
    generateTestFile();
    exportTestFile();
    closeExportModal();
  };

  const generateTestFile = () => {
    if (reactTestCase.hasReact > 0) {
      return (
        addComponentImportStatement(),
        addReactImportStatements(),
        addMockData(),
        addDescribeBlocks(),
        (testFileCode = beautify(testFileCode, {
          brace_style: "collapse, preserve-inline",
          indent_size: 2,
          space_in_empty_paren: true,
          e4x: true,
        }))
      );
    }
    if (reduxTestCase.hasRedux > 0) {
      return (
        addReduxImportStatements(),
        addReduxTestStatements(),
        (testFileCode = beautify(testFileCode, {
          indent_size: 2,
          space_in_empty_paren: true,
          e4x: true,
        }))
      );
    }
    if (hooksTestCase.hasHooks > 0) {
      return (
        addHooksImportStatements(),
        addHooksTestStatements(),
        (testFileCode = beautify(testFileCode, {
          indent_size: 2,
          space_in_empty_paren: true,
          e4x: true,
        }))
      );
    }
    if (endpointTestCase.hasEndpoint > 0) {
      return (
        addEndpointImportStatements(),
        addEndpointTestStatements(),
        (testFileCode = beautify(testFileCode, {
          indent_size: 2,
          space_in_empty_paren: true,
          e4x: true,
        }))
      );
    }
    if (puppeteerTestCase.hasPuppeteer > 0) {
      return (
        addPuppeteerImportStatements(),
        addPuppeteerTestStatements(),
        (testFileCode = beautify(testFileCode, {
          indent_size: 2,
          space_in_empty_paren: true,
          e4x: true,
        }))
      )
    }
  };

  /* ------------------------------------------ REACT IMPORT + TEST STATEMENTS ------------------------------------------ */

  // React Import Statements
  const addReactImportStatements = () => {
    testFileCode += `import { render, fireEvent } from '@testing-library/react'; 
    import { build, fake } from 'test-data-bot'; 
    import '@testing-library/jest-dom/extend-expect'
    \n`;
  };

  // React Component Import Statement (Render Card)
  const addComponentImportStatement = () => {
    const componentPath = reactTestCase.statements.componentPath;
    let filePath = path.relative(projectFilePath, componentPath);
    filePath = filePath.replace(/\\/g, '/');
    testFileCode += `import ${reactTestCase.statements.componentName} from '../${filePath}';`;
  };

  const addDescribeBlocks = () => {
    const describeBlocks = reactTestCase.describeBlocks;

    describeBlocks.allIds.forEach((id) => {
      testFileCode += `describe('${describeBlocks.byId[id].text}', () => {`
      addReactItStatement(id)
      testFileCode += `}); \n`
    })
  }

  // React It Statements
  const addReactItStatement = (describeId) => {
    const itStatements = reactTestCase.itStatements;
    itStatements.allIds.forEach((itId) => {
      if (itStatements.byId[itId].describeId === describeId) {
        testFileCode += `it('${itStatements.byId[itId].text}', () => {`;
        addReactStatements(itId)
        testFileCode += '})'
      }
      testFileCode += '\n';
    });
  };

  const addReactStatements = (itId) => {
    const statements = reactTestCase.statements
    const methods = identifyMethods(itId);
    statements.allIds.forEach((id) => {
      let statement = statements.byId[id];
      if (statement.itId === itId) {
        switch (statement.type) {
          case 'action':
            return addAction(statement);
          case 'assertion':
            return addAssertion(statement);
          case 'render':
            return addRender(statement, methods);
          default:
            return statement;
        }
      }
    });
  }

  const identifyMethods = (itId) => {
    const methods = new Set([]);
    reactTestCase.statements.allIds.forEach(id => {
      let statement = reactTestCase.statements.byId[id];
      if (statement.itId === itId) {
        if (statement.type === 'action' || statement.type === 'assertion') {
          methods.add(statement.queryVariant + statement.querySelector);
      }
    };
  })
    return Array.from(methods).join(', ');
  };

   // Render Jest Test Code
   const addRender = (statement, methods) => {
    let props = createRenderProps(statement.props);
    testFileCode += `const {${methods}} = render(<${reactTestCase.statements.componentName} ${props}/>);`;
  };

  // Render Props Jest Test Code
  const createRenderProps = props => {
    return props.reduce((acc, prop) => {
      return acc + `${prop.propKey}={${prop.propValue}}`;
    }, '');
  };

  /* ------------------------------------------ REDUX IMPORT + TEST STATEMENTS ------------------------------------------ */

  // Redux Import Statements
  const addReduxImportStatements = () => {
    reduxTestCase.reduxStatements.forEach(statement => {
      switch (statement.type) {
        case 'async':
          return (
            addAsyncImportStatement(),
            createPathToActions(statement),
            createPathToTypes(statement),
            addAsyncVariables()
          );
        case 'action-creator':
          return (
            addActionCreatorImportStatement(),
            createPathToActions(statement),
            createPathToTypes(statement)
          );
        case 'middleware':
          return addMiddlewareImportStatement(), createPathToMiddlewares(statement);
        case 'reducer':
          return (
            addReducerImportStatement(),
            createPathToReducers(statement),
            createPathToTypes(statement)
          );
        default:
          return statement;
      }
    });
    testFileCode += '\n';
  };

  // Async Import Statements
  const addAsyncImportStatement = () => {
    testFileCode += `import '@testing-library/jest-dom/extend-expect';
    import configureMockStore from 'redux-mock-store';
    import thunk from 'redux-thunk';
    import fetchMock from 'fetch-mock';`;
  };

  const addAsyncVariables = () => {
    testFileCode += `\n const middlewares = [thunk];
    const mockStore = configureMockStore(middlewares);`;
  };

  // AC Import Statements
  const addActionCreatorImportStatement = () => {
    testFileCode += `import { fake } from 'test-data-bot';
    import '@testing-library/jest-dom/extend-expect'`;
  };

  // Reducer Import Statements
  const addReducerImportStatement = () => {
    testFileCode += `import { render } from '@testing-library/react';
    import '@testing-library/jest-dom/extend-expect';`;
  };

  // Middleware Import Statements
  const addMiddlewareImportStatement = () => {
    testFileCode += `import '@testing-library/jest-dom/extend-expect';`;
  };

  // Redux Test Statements
  const addReduxTestStatements = () => {
    testFileCode += `\n test('${reduxTestCase.reduxTestStatement}', () => {`;
    reduxTestCase.reduxStatements.forEach(statement => {
      switch (statement.type) {
        case 'async':
          return addAsync(statement);
        case 'action-creator':
          return addActionCreator(statement);
        case 'middleware':
          return addMiddleware(statement);
        case 'reducer':
          return addReducer(statement);
        default:
          return statement;
      }
    });
    testFileCode += '});';
    testFileCode += '\n';
  };

  /* ------------------------------------------ HOOKS & CONTEXT IMPORT + TEST STATEMENTS ------------------------------------------ */

  // Hooks & Context Import Statements
  const addHooksImportStatements = () => {
    hooksTestCase.hooksStatements.forEach(statement => {
      switch (statement.type) {
        case 'hook-updates':
          return addRenderHooksImportStatement(), createPathToHooks(statement);
        case 'hookRender':
          return addRenderHooksImportStatement(), createPathToHooks(statement);
        case 'context':
          return addContextImportStatements(), createPathToContext(statement);
        default:
          return statement;
      }
    });
    testFileCode += '\n';
  };

  // Context Import Statements
  const addContextImportStatements = () => {
    testFileCode += `import { render } from '@testing-library/react'; 
    import '@testing-library/jest-dom/extend-expect'`;
  };

  // Hooks Import Statements
  const addRenderHooksImportStatement = () => {
    testFileCode += `import { renderHook, act } from '@testing-library/react-hooks'
    import '@testing-library/jest-dom/extend-expect'`;
  };

  // Hooks & Context Test Statements
  const addHooksTestStatements = () => {
    testFileCode += `\n test('${hooksTestCase.hooksTestStatement}', () => {`;
    hooksTestCase.hooksStatements.forEach(statement => {
      switch (statement.type) {
        case 'hook-updates':
          return addHookUpdates(statement);
        case 'hookRender':
          return addHookRender(statement);
        case 'context':
          return addContext(statement);
        default:
          return statement;
      }
    });
    testFileCode += '});';
    testFileCode += '\n';
  };

  /* ------------------------------------------ ENDPOINT IMPORT + TEST STATEMENTS ------------------------------------------ */

  // Endpoint Import Statements
  const addEndpointImportStatements = () => {
    endpointTestCase.endpointStatements.forEach(statement => {
      switch (statement.type) {
        case 'endpoint':
          return createPathToServer(statement);
        default:
          return statement;
      }
    });
    testFileCode += '\n';
  };

  const addEndpointTestStatements = () => {
    testFileCode += `\n test('${endpointTestCase.endpointTestStatement}', async (done) => {`;
    endpointTestCase.endpointStatements.forEach(statement => {
      switch (statement.type) {
        case 'endpoint':
          return addEndpoint(statement);
        default:
          return statement;
      }
    });
    testFileCode += 'done();';
    testFileCode += '});';
    testFileCode += '\n';
  };

 /* ------------------------------------------ PUPPETEER IMPORT + TEST STATEMENTS ------------------------------------------ */
 
 /* getLargestContentfulPaint()
    - creating a new PerformanceObserver object which will call the callback function when observed performance events happen
    - setting observer() method to observe the LCP performance entries
 */
 
 const addLCPfunction = () => {
    testFileCode += `      
      function getLargestContentfulPaint() {
        window.largestContentfulPaint = 0;
    
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          window.largestContentfulPaint = lastEntry.renderTime || lastEntry.loadTime;
        });
    
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
    
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'hidden') {
              observer.takeRecords();
              observer.disconnect();
          }
        });
      }`
  }
 
  const addPuppeteerImportStatements = () => {
    puppeteerTestCase.puppeteerStatements.forEach(statement => {
      switch (statement.type) {
        case 'paintTiming':
          testFileCode = `import puppeteer from 'puppeteer';\n`;
          addLCPfunction();
          return 
        default:
          return statement;
      }
    });
    testFileCode += '\n';
  }

  const addPuppeteerTestStatements = () => {
    puppeteerTestCase.puppeteerStatements.forEach(statement => {
      switch (statement.type) {
        case 'paintTiming':
          return addPuppeteerPaintTiming(statement);
        default:
          return statement;
      }
    });
  }

  /* ------------------------------------------ FILEPATHS ------------------------------------------ */

  // Actions Filepath
  const createPathToActions = statement => {
    let filePath = path.relative(projectFilePath, statement.filePath);
    filePath = filePath.replace(/\\/g, '/');
    testFileCode += `import * as actions from '../${filePath}';`;
  };

  // Reducer Filepath
  const createPathToReducers = statement => {
    let filePath = path.relative(projectFilePath, statement.reducersFilePath);
    filePath = filePath.replace(/\\/g, '/');
    testFileCode += `import ${statement.reducerName} from '../${filePath}';`;
  };

  // Types Filepath
  const createPathToTypes = statement => {
    let filePath = path.relative(projectFilePath, statement.typesFilePath);
    filePath = filePath.replace(/\\/g, '/');
    testFileCode += `import * as types from '../${filePath}';`;
  };

  // Middleware Filepath
  const createPathToMiddlewares = statement => {
    let filePath = path.relative(projectFilePath, statement.middlewaresFilePath);
    filePath = filePath.replace(/\\/g, '/');
    testFileCode += `import * as middleware from '../${filePath}';`;
  };

  // Hooks Filepath
  const createPathToHooks = statement => {
    let filePath = path.relative(projectFilePath, statement.hookFilePath);
    filePath = filePath.replace(/\\/g, '/');
    testFileCode += `import ${statement.hook} from '../${filePath}';`;
  };

  // Context Filepath
  const createPathToContext = statement => {
    let filePath = path.relative(projectFilePath, statement.contextFilePath);
    filePath = filePath.replace(/\\/g, '/');
    testFileCode += `import { ${statement.providerComponent}, ${statement.consumerComponent}, ${statement.context} } from '../${filePath}';`;
  };

  // Endpoint Filepath
  const createPathToServer = statement => {
    let filePath = path.relative(projectFilePath, statement.serverFilePath);
    filePath = filePath.replace(/\\/g, '/');
    testFileCode = `const app = require('../${filePath}');
  const supertest = require('supertest')
  const request = supertest(app)\n`;

    testFileCode += '\n';
  };

  /* ------------------------------------------ MOCK DATA + METHODS ------------------------------------------ */

  const addMockData = () => {
    mockData.forEach(mockDatum => {
      let fieldKeys = createMockDatumFieldKeys(mockDatum);
      testFileCode += `const mock${mockDatum.name.charAt(0).toUpperCase() +
        mockDatum.name.slice(1)} = build('${mockDatum.name}').fields({ ${fieldKeys} })();`;
    });
    testFileCode += '\n';
  };

  const createMockDatumFieldKeys = mockDatum => {
    return mockDatum.fieldKeys.reduce((fieldKeysCode, mockDatum) => {
      return fieldKeysCode + `${mockDatum.fieldKey}: fake(f => f.random.${mockDatum.fieldType}()),`;
    }, '');
  };



  /* ------------------------------------------ TEST STATEMENTS ------------------------------------------ */

  // Action Jest Test Code
  const addAction = action => {
    if (action.eventValue) {
      testFileCode += `fireEvent.${action.eventType}(${action.queryVariant + action.querySelector}
                      ('${action.queryValue}'), { target: { value: ${action.eventValue} } });`;
    } else {
      testFileCode += `fireEvent.${action.eventType}(${action.queryVariant + action.querySelector}
                      ('${action.queryValue}'));`;
    }
  };

  // Assertion Jest Test Code
  const addAssertion = assertion => {
    testFileCode += `expect(${assertion.queryVariant + assertion.querySelector}
      (${assertion.queryValue})).${assertion.matcherType}(${assertion.matcherValue});`;
  };


  // Middleware Jest Test Code
  const addMiddleware = middleware => {
    testFileCode += `const ${middleware.queryValue} = () => {
      const store = {
        getState: jest.fn(() => ({})),
        dispatch: jest.fn()
      }
      const next = jest.fn()
      const invoke = action => ${middleware.queryType}(store)(next)(action)
      return { store, next, invoke } 
    }
    \n`;

    if (middleware.queryValue === 'passes_non_functional_arguments') {
      testFileCode += `const { next, invoke } = ${middleware.queryValue}()
      const action = {type : 'TEST'}
      invoke(action)
      expect(${middleware.querySelector}).${middleware.queryVariant}(action)`;
    } else if (middleware.queryValue === 'calls_the_function') {
      testFileCode += `const { invoke } = ${middleware.queryValue}()
      const fn = jest.fn()
      invoke(fn)
      expect(${middleware.querySelector}).${middleware.queryVariant}()`;
    } else if (middleware.queryValue === 'passes_functional_arguments') {
      testFileCode += `const { store, invoke } = ${middleware.queryValue}()
      invoke((dispatch, getState) => {
        dispatch('Test Dispatch')
        getState()
      })
      expect(${middleware.querySelector}).${middleware.queryVariant}('Test Dispatch')
      expect(${middleware.querySelector}).${middleware.queryVariant}()`;
    }
  };

  // Reducer Jest Test Code 
  const addReducer = reducer => {
    testFileCode += `expect(${reducer.reducerName}(${reducer.initialState},{${reducer.reducerAction}})).toEqual(${reducer.expectedState})`;
  };

  // Async AC Jest Test Code
  const addAsync = async => {
    testFileCode += `fetchMock.${async.method}('${async.route}', ${async.requestBody});
    const expectedActions = ${async.expectedResponse};
    const store = mockStore(${async.store});
    return store.dispatch(actions.${async.asyncFunction}()).then(() => {
      expect(store.getActions()).toEqual(expectedActions)
    })`;
  };

  // Action Creator Jest Test Code
  const addActionCreator = actionCreator => {
    if (actionCreator.payloadKey && actionCreator.payloadType) {
      testFileCode += `const ${actionCreator.payloadKey} = fake(f => f.random.${actionCreator.payloadType}())
      const expectedAction = { 
        type: types.${actionCreator.actionType}, 
        ${actionCreator.payloadKey} 
      };
      expect(actions.${actionCreator.actionCreatorFunc}(${actionCreator.payloadKey})).toEqual(expectedAction);`;
    } else {
      testFileCode += `const expectedAction = { 
        type: types.${actionCreator.actionType} 
      }; 
      expect(actions.${actionCreator.actionCreatorFunc}()).toEqual(expectedAction);`;
    }
  };

  // Hook: Updates Jest Test Code
  const addHookUpdates = hookUpdates => {
    testFileCode += `const {result} = renderHook (() => ${hookUpdates.hook}());
    act(() => {
      result.current.${hookUpdates.callbackFunc}();
    });
    expect(result.current.${hookUpdates.managedState}).toBe(${hookUpdates.updatedState})`;
  };

  // Hook: Renders Jest Test Code
  const addHookRender = hookRender => {
    testFileCode += `const {result} = renderHook(() => ${hookRender.hook}(${hookRender.parameterOne}))
    expect(result.current.${hookRender.returnValue}).toBe(${hookRender.expectedReturnValue})`;
  };

  // Context Jest Test Code
  const addContext = context => {
    if (context.queryValue === 'shows_default_value') {
      testFileCode += `const mockValue = {Data: '${context.values}'}
      const { ${context.querySelector} } = render(<${context.consumerComponent}/>)
      expect(${context.querySelector}(mockValue.Data)).${context.queryVariant}('${context.values}')`;
    }
    if (context.queryValue === 'shows_value_from_provider') {
      testFileCode += `const mockValue = {Data: '${context.values}'}
      const { ${context.querySelector} } = render (
        <${context.context}.Provider value={mockValue}>
          <${context.consumerComponent}/>
        </${context.context}.Provider>
      )
      expect(${context.querySelector}(mockValue.Data)).${context.queryVariant}('${context.values}')`;
    }
    if (context.queryValue === 'component_provides_context_value') {
      testFileCode += `const mockValue = {Data: '${context.values}'}
      const { ${context.querySelector} } = render (
        <${context.providerComponent} value={mockValue}>
          <${context.context}.Consumer>
          {value => <span>Recieved: {value} </span>}
          <${context.context}.Consumer/>
        </${context.providerComponent}>
      )
      expect(${context.querySelector}(/^Recieved:/).textContent).${context.queryVariant}('${context.values}')`;
    }
    if (context.queryValue === 'renders_providers_+_consumers_normally') {
      testFileCode += `const mockValue = {Data: '${context.values}'}
      const { ${context.querySelector} } = render (
        <${context.providerComponent} value={mockValue}>
          <${context.consumerComponent}/>
        </${context.providerComponent}>
      )
      expect(${context.querySelector}(mockValue.Data).textContent).${context.queryVariant}('${context.values}')`;
    }
  };

  // Endpoint Jest Test Code
  const addEndpoint = statement => {
    testFileCode += `const response = await request.${statement.method}('${statement.route}')
    expect(response.${statement.expectedResponse}).toBe(${statement.value});`;
  };

  // Puppeteer Form Jest Test Code
  const addPuppeteerPaintTiming = statement => {
    const browserOptions = {};
    
    if(statement.browserOptions.length > 0) {
      statement.browserOptions.map(option => {
        if(option.optionValue === 'true') option.optionValue = true
        else if(option.optionValue === 'false') option.optionValue = false
        //if optionValue is a stringified number, convert it back to number 
        else if(!isNaN(Number(option.optionValue))) option.optionValue = Number(option.optionValue)
        browserOptions[option.optionKey] = option.optionValue
        return option
      })
    }
    
    testFileCode += `
      describe('${statement.describe}', () => {
        let paints, lcp;
        beforeAll( async () => {
          let app = '${statement.url}';
          let browser = await puppeteer.launch(${statement.browserOptions.length? JSON.stringify(browserOptions).replace(/"([^"]+)":/g, '$1:') : '{}'});
          const page = await browser.newPage();
          await page.target().createCDPSession();
          await page.evaluateOnNewDocument(getLargestContentfulPaint);
          await page.goto(app);

          lcp = await page.evaluate(() => window.largestContentfulPaint);
          
          paints = await page.evaluate(_ => {
            const result = {};
            performance.getEntriesByType('paint').map(entry => {
              result[entry.name] = entry.startTime;
            });
            return result;
          });
          await browser.close();
        })
          
        it('${statement.firstPaintIt}', async () => {
          expect(paints['first-paint']).toBeLessThan(${statement.firstPaintTime})
        })
        it('${statement.FCPIt}', async () => {
          expect(paints['first-contentful-paint']).toBeLessThan(${statement.FCPtTime})
        })
        it('${statement.LCPIt}', async () => {
          expect(paints['first-contentful-paint']).toBeLessThan(${statement.LCPTime})
        })
      });
    `;
  };

  /* ------------------------------------------ EXPORT + DISPLAY FILE ------------------------------------------ */

  const exportTestFile = async () => {
    if (!fs.existsSync(projectFilePath + '/__tests__')) {
      fs.mkdirSync(projectFilePath + '/__tests__');
    }
    await fs.writeFile(projectFilePath + `/__tests__/${fileName}.test.js`, testFileCode, err => {
      if (err) throw err;
    });
    displayTestFile(projectFilePath + '/__tests__');
  };

  const displayTestFile = testFolderFilePath => {
    const fileContent = fs.readFileSync(testFolderFilePath + `/${fileName}.test.js`, 'utf8');
    dispatchToGlobal(displayFileCode(fileContent));
    dispatchToGlobal(loadProject('reload'));
    dispatchToGlobal(toggleFolderView(testFolderFilePath));
    dispatchToGlobal(highlightFile(`${fileName}.test.js`));
  };

  const modalStyles = {
    overlay: {
      zIndex: 3,
    },
  };

  return (
    <ReactModal
      className={styles.modal}
      isOpen={isExportModalOpen}
      onRequestClose={closeExportModal}
      contentLabel='Save testing file'
      shouldCloseOnOverlayClick={true}
      shouldCloseOnEsc={true}
      ariaHideApp={false}
      style={modalStyles}
    >
      <div id={styles.title}>
        <p>Convert to Javascript Code</p>
        <svg id={styles.close} onClick={closeExportModal}>
          <path d='M19,3H16.3H7.7H5A2,2 0 0,0 3,5V7.7V16.4V19A2,2 0 0,0 5,21H7.7H16.4H19A2,2 0 0,0 21,19V16.3V7.7V5A2,2 0 0,0 19,3M15.6,17L12,13.4L8.4,17L7,15.6L10.6,12L7,8.4L8.4,7L12,10.6L15.6,7L17,8.4L13.4,12L17,15.6L15.6,17Z' />
        </svg>
      </div>
      <div id={styles.body}>
        <p>File Name</p>
        <input type='text' value={fileName} onChange={handleChangeFileName} />
        {invalidFileName && <p>A file with the name '{fileName}' already exists.</p>}
        <button id={styles.save} onClick={closeExportModal}>
          Cancel
        </button>
        <button id={styles.save} onClick={handleClickSave}>
          Save
        </button>
      </div>
    </ReactModal>
  );
};

export default ExportFileModal;
