import {component$, useClientEffect$,useWatch$} from '@builder.io/qwik'
import QRCode from 'qrcode'

export interface ContractAddress {
    addr:string
}

export const QrFunc = component$((props:ContractAddress) => {

    useClientEffect$(()=>{
    QRCode.toCanvas(document.getElementById('canvas2'), props.addr, function (error) {
        if (error) console.error(error)
        console.log('QR success!');
      })
    })
   
   return(
    <canvas id="canvas2" width="150" height="150" ></canvas>
   )
    })

export const GenerateQR = component$((props:{addr:string})=> {

  useClientEffect$(async()=>{
    QRCode.toCanvas(document.getElementById('canvas'), props.addr) 

    })
    return(
      <canvas id="canvas" width="150" height="150"> </canvas>
      
     
     )
})
