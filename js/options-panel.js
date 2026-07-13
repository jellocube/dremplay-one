import { settings } from './settings.js';

const optionFov=document.getElementById('optionFov'),optionTime=document.getElementById('optionTime'),optionGravity=document.getElementById('optionGravity'),optionLightmode=document.getElementById('optionLightmode');
export function syncOptionsWindow(){
  optionFov.value=String(settings.fovDegrees);optionTime.value=String(settings.timeOfDay||24);optionGravity.value=String(-settings.gravityAcceleration);optionLightmode.value=String(settings.lightMode);
  document.getElementById('optionFovValue').textContent=`${settings.fovDegrees.toFixed(0)}°`;document.getElementById('optionTimeValue').textContent=`${(settings.timeOfDay||24).toFixed(2)}h`;document.getElementById('optionGravityValue').textContent=`${(-settings.gravityAcceleration).toFixed(1)}`;
}
optionFov.addEventListener('input',()=>{settings.fovDegrees=Number(optionFov.value);syncOptionsWindow();});
optionTime.addEventListener('input',()=>{settings.timeOfDay=Number(optionTime.value)%24;syncOptionsWindow();});
optionGravity.addEventListener('input',()=>{settings.gravityAcceleration=-Number(optionGravity.value);syncOptionsWindow();});
optionLightmode.addEventListener('change',()=>{settings.lightMode=Number(optionLightmode.value);syncOptionsWindow();});
