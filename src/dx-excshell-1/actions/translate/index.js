/*
* <license header>
*/

/**
 * This is a sample action integrating with a custom PowerAutomate translation flow
 *
 * Note:
 * Authentication and authorization checks against Adobe Identity Management System have been deactivated for this Runtime action.
 */

 const fetch = require('node-fetch')
 const { Core } = require('@adobe/aio-sdk')
 const { errorResponse, stringParameters, checkMissingRequestInputs } = require('../utils')
 
 // main function that will be executed by Adobe I/O Runtime
 async function main (params) {
   // create a Logger
   const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })
   try {
     // 'info' is the default level if not set
     logger.info('Calling the main action')
     // log parameters, only if params.LOG_LEVEL === 'debug'
     logger.debug(stringParameters(params))
     // check for missing request input parameters and headers
     const requiredParams = ['text']
     const requiredHeaders = []
     const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
     if (errorMessage) {
       // return and log client errors
       return errorResponse(400, errorMessage, logger)
     }
     // The custom Power Automate API endpoint to use
     const apiEndPoint = 'https://prod-137.westus.logic.azure.com/workflows/8ffa2be0fbae42d2a2f03529b8259c0e/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=HVINGSzwd9OgLcWwzEJ5HwJvqBZKSKG5IG_C6F-7cc0'
     // Fetches content from custom Power Automate API, using a POST method
     const res = await fetch(apiEndPoint, {method: 'POST', headers: { "Content-Type": "application/json" }, body: JSON.stringify({"text": "\"" + params.text + "\""})})
     if (!res.ok) {
       throw new Error('request to ' + apiEndPoint + ' failed with status code ' + res.status)
     }
     // Builds the Adobe I/O Runtime response from the API call response
     const content = await res.json()
     const response = {
       statusCode: 200,
       body: content
     }
     // Logs the response status code
     logger.info(`${response.statusCode}: successful request`)
     return response
   } catch (error) {
     // Logs any server errors
     logger.error(error)
     // Returns with 500
     return errorResponse(500, 'server error', logger)
   }
 }
 
 exports.main = main