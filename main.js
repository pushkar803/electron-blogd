const {app, BrowserWindow, ipcMain} = require('electron') 
const url = require('url') 
const path = require('path')  
const Store = require('electron-store');
const store = new Store();
const { exec } = require('child_process');

let win  

function createWindow() { 

   win = new BrowserWindow({
      width: 800, 
      height: 600,
      transparent: true,
      webPreferences: {
         nodeIntegration: true,
         contextIsolation: false,
         enableRemoteModule: true
      },
   }) 

   myAddress = store.get('myAddress')
   
   if( typeof myAddress === "undefined" || myAddress === ''){
      console.log("its first time")
      win.loadURL(url.format ({ 
         pathname: path.join(__dirname, 'register.html'), 
         protocol: 'file:', 
         slashes: true 
      })) 
   }
   else{
      win.loadURL(url.format ({ 
         pathname: path.join(__dirname, 'home.html'), 
         protocol: 'file:', 
         slashes: true 
      })) 
   }

   ipcMain.on('ipc-req-get-mnemonic', async (event, args) => {
      c = 'blogd keys mnemonic'
      await ExecuteCommand(c, false).then((resp)=>{
         console.log(resp)
         store.set('lastMnemonic', resp.op);
         event.sender.send('resp-get-mnemonic',resp)
      })
   })  

   ipcMain.on('ipc-req-register', async (event, accName) => {
      mnemonic = store.get('lastMnemonic')
      console.log("lastMnemonic: "+mnemonic)
      c = `echo '${mnemonic}'| blogd keys add ${accName} --recover --output json`
      c = c.replace(/(\r\n|\n|\r)/gm, "");
      console.log("c:"+c)
      await ExecuteCommand(c, true).then((resp)=>{
         console.log(resp)
         store.set('myAddress', resp.op.address);
         event.sender.send('resp-register',resp)
      })
   })  

   ipcMain.on('ipc-req-get-my-address', async (event, args) => {
      myAddress = store.get('myAddress');
      console.log(myAddress)
      event.sender.send('resp-get-my-address',{
         "error": false,
         "op":myAddress
      })
   })  

   ipcMain.on('ipc-req-sign-out', async (event, args) => {
      store.set('myAddress', '');
      event.sender.send('resp-sign-out',{
         "error": false,
      })
   })  


}  

app.on('ready', createWindow) 

ExecuteCommand = async (command, isJsonNeeded)=>{

   console.log("inside ExecuteCommand")
   return new Promise(function(resolve, reject){
      exec(command, (err, stdout, stderr) => {

         if (err) {
           reject({
            "error": true,
            "op":err
           });
         }
   
         if (stderr) {
            reject({
            "error": true,
            "op":stderr
           });
         }
   
         resolve({
            "error": false,
            "op":isJsonNeeded?JSON.parse(stdout):stdout
         });
   
       });
   })
}