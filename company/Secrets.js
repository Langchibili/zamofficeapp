'use client'

export const FakeStr1 = 'kahs3lahebblo2uwb00an~va5lwi_ad_fgaljdj'; // security stuff
export const FakeStr2 = 'klahewi_ad_fgalloanv;;aitalkjfajhsbbluwba==hn3vajd5j=+;'
export const LencoPubKey = 'pub-42fcf783d7e8d0428f9e94600e291e3d82e425d98359763b'; // security stuff
export const LencoApiKey = 'klahewi_ad_fgalloanv;;aitalkjfajhsbbluwba==hn3vajd5j=+;'
export const frontendUpdateKey = 'kahs3lahebblo2uwb00an~va5lwi_ad_fgaljdjklahewi_ad_fgalloanvaitalkjfajhsbbluwbahn3vajd5j'


export const getJWT = ()=>{
    if(typeof document !== "undefined"){
      let jwt = localStorage.getItem('zm_company_jwt')
      if(!jwt){
          return null
      }
      else{
          jwt = jwt.split(FakeStr1)[1]
          if(jwt === undefined){
            return null
          }
          return jwt.split(FakeStr2)[0]
      }
    }
}

export const saveJwt = (jwt)=>{
    if(typeof document !== "undefined"){
      localStorage.setItem('zm_company_jwt',FakeStr1+jwt+FakeStr2)
    }
}

