const { Core } = require('@adobe/aio-sdk')
const fetch = require('node-fetch')
const { errorResponse, getBearerToken, checkMissingRequestInputs } = require('../utils')

// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })
  
  try {
    // check for missing request input parameters and headers
    const requiredParams = ['instance', 'api', 'path']
    const requiredHeaders = ['Authorization']
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
    if (errorMessage) {
      // return and log client errors
      return errorResponse(400, errorMessage, logger)
    }
    
    // extract the user Bearer token from the Authorization header
    const token = getBearerToken(params)
    
    // replace this with the api you want to access
    const apiEndpoint = `${params.instance}${params.api}${params.path}.json?configid=ims`;
    
    // fetch content from external api endpoint
    let res = await fetch(apiEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    if (!res.ok) {
      throw new Error('request to ' + apiEndpoint + ' failed with status code ' + res.status)
    }
    
    const content = await res.json()
    const thumbnail = content.links.find(link => link.rel[0] === 'thumbnail');
    
    if (thumbnail) {
      const res = await fetch(`${thumbnail.href}?configid=ims`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      const buffer = await res.arrayBuffer();
  
      const response = {
        statusCode: 200,
        body: {
          base64: Buffer.from(buffer).toString('base64')
        }
      }
      return response;
    }
    
    const response = {
      statusCode: 404
    }
    logger.info(`${response.statusCode}: 404 request`)
    
    return response;
  } catch (error) {
    // log any server errors
    logger.error(error)
    // return with 500
    return errorResponse(500, error.message, logger)
  }
}

exports.main = main
