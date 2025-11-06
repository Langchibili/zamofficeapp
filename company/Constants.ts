'use client'

import { getJWT, saveJwt } from "./Secrets"

// --- SET YOUR ENVIRONMENT HERE ---
export const environment = 'local'
// export const environment = 'live'
// export const environment = 'live2'
// export const environment = 'test' // mvp will run here

// --- EXPORTED AUTH HELPERS ---
export const getJwt = getJWT

// --- CONFIG MAP ---
const configMap = {
  local: {
    api: 'http://localhost:1330/api',
    backend: 'http://localhost:1330',
    client: 'http://localhost:3007',
    socket: 'http://localhost:3002',
    debug: true,
  },
  live: {
    api: 'https://api.vectorfinancelimited.com/api',
    backend: 'https://api.vectorfinancelimited.com',
    client: 'https://portal.vectorfinancelimited.com',
    socket: 'https://socket.driverbase.app',
    debug: false,
  },
  live2: {
    api: 'https://api.vectorfinancelimited.app/api',
    backend: 'https://api.vectorfinancelimited.app',
    client: 'https://portal.vectorfinancelimited.app',
    socket: 'https://socket.driverbase.app',
    debug: false,
  },
  test: {
    api: 'https://testapi.vectorfinancelimitedapi.com/api',
    backend: 'https://api.vectorfinancelimitedapi.com',
    client: 'https://portal.vectorfinancelimited.com',
    socket: 'https://socket.driverbase.app',
    debug: true,
  },
}

// --- APPLY SELECTED CONFIG ---
const cfg = configMap[environment] || configMap.test

// --- EXPORT FINAL VALUES ---
export const api_url = cfg.api
export const backEndUrl = cfg.backend
export const clientUrl = cfg.client
export const socketUrl = cfg.socket
export const debugMode = cfg.debug

 
 export function log(...args) {
    if (environment === "local") {
      console.log(...args)
    } else {
      return // Do nothing on live or test servers unless environment is set to local
      }
 }

export const getFeature = async (featureId)=>{
    const feature = await fetch(api_url+'/app-features/'+featureId,{
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(response => response.json())
      .then(data => data)
      .catch(error => console.error(error))
      if(feature && feature.data && feature.data.attributes){
         return feature.data.attributes.status
      }
      return null
  }
 
  const getUserAccount = async (jwt)=>{
    return await fetch(api_url+'/users/me',{
     headers: {
       'Authorization': `Bearer ${jwt}`,
       'Content-Type': 'application/json'
     }
   }).then(response => response.json())
     .then(data => data)
     .catch(error => console.error(error))
 }
 
 const getUserAccountWithUsernameAndPassword = async (username,password)=>{
  const authObject = {
    identifier: username,
    password: password
  } 
  return await fetch(api_url+'/auth/local', {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json'
    },
    body: JSON.stringify(authObject),
  })
  .then(response => response.json())
  .then(data => data)
}

 const checkIfUserWithUsernameExists = async (username)=>{
  const response = await fetch(api_url+'/auths?username='+username,{
   headers: {
     'Content-Type': 'application/json'
   }
 }).then(response => response.json())
   .then(data => data)
   .catch(error => console.error(error))

   if(response.hasOwnProperty('user')) { 
    return true 
   } // means a user with the username exists
   return false
}

export const checkUserLogginStatus = async () =>{
    let logginStatusObject = {
        user: null,
        status: false
    }
    const jwt = getJWT()
    if(!jwt){
        return logginStatusObject
    }
    else{
        const user = await fetch(api_url+'/users/me?populate=*', {
            headers: {
             'Authorization': `Bearer ${jwt}`,
             'Content-Type': 'application/json'
            }
          })
          .then(response => response.json())
          .then(data => data)
        logginStatusObject.user = user
        logginStatusObject.status = true    
    }
    return logginStatusObject
}

export const submitCreateUserRequest = async (registerObject)=>{
    return await fetch(api_url+'/auth/local/register', {
        method: 'POST',
        headers: {
         'Content-Type': 'application/json'
        },
        body: JSON.stringify(registerObject),
      })
      .then(response => response.json())
      .then(data => data)
  }


  export function emitEvent(socket,eventType, data){ // an even emitting function for sockets
    socket.emit(eventType, data)
  } 