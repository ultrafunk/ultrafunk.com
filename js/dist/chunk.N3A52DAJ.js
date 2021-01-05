var $=!1,k=class{constructor(e="unknown"){this.moduleName=W(e.toUpperCase(),20,".")}isDebug(){return $}warn(e){console.warn(`${this.moduleName}:`,e)}error(e){console.error(`${this.moduleName}:`,e)}},F=class extends k{constructor(e){super(e)}log(e){console.log(`${this.moduleName}:`,e)}logEventLog(e,s,r){let a=[];for(let u=0;u<e.length;u++){let c={eventSource:this.getObjectKeyForValue(s,e[u].eventSource),eventType:this.getObjectKeyForValue(r,e[u].eventType),uId:e[u].uId,timeStamp:e[u].timeStamp};a.push(c)}this.log(a)}getObjectKeyForValue(e,s){return Object.keys(e).find(r=>e[r]===s)}},M=class extends k{constructor(e){super(e)}log(){}logEventLog(){}getObjectKeyForValue(){}};function g(t){return $===!0?new F(t):new M(t)}function W(t,e,s){return t.length>e?t.slice(0,e):t.padEnd(e,s)}var ae=g("crossfade"),ce=g("mediaplayers"),B=/\s{1,}[–·-]\s{1,}/i;function de(t,e,s=B){if(e!==null&&e.length>0){t.artist=e,t.title="";let r=e.match(s);r!==null&&(t.artist=e.slice(0,r.index),t.title=e.slice(r.index+r[0].length))}}var P=g("settings"),o=1,i=2,p=3,n={version:{description:"",type:o,values:[1,999999],default:26,valueStrings:[]},user:{keyboardShortcuts:{description:"Keyboard Shortcuts",type:i,values:[!0,!1],default:!0,valueStrings:["ON","OFF"]},masterVolume:{description:"Master Volume",type:o,values:[0,25,50,75,100],default:100,valueStrings:["0%","25%","50%","75%","100%"]},masterMute:{description:"Master Mute",type:i,values:[!0,!1],default:!1,valueStrings:["ON","OFF"]},autoplay:{description:"Autoplay next track",type:i,values:[!0,!1],default:!0,valueStrings:["ON","OFF"]},autoCrossfade:{description:"Auto Crossfade to next track",type:i,values:[!0,!1],default:!1,valueStrings:["ON","OFF"]},autoCrossfadeLength:{description:"Auto Crossfade Length",type:o,values:[5,10,15,20,25,30],default:20,valueStrings:["5 sec","10 sec","15 sec","20 sec","25 sec","30 sec"]},autoCrossfadeCurve:{description:"Auto Crossfade Curve",type:o,values:[0,1],default:1,valueStrings:["Equal Power","Linear"]},autoScroll:{description:"Autoscroll to next track",type:i,values:[!0,!1],default:!0,valueStrings:["ON","OFF"]},smoothScrolling:{description:"Smooth Scrolling to next track",type:i,values:[!0,!1],default:!0,valueStrings:["ON","OFF"]},autoExitFullscreen:{description:"Exit Fullscreen on next track",type:i,values:[!0,!1],default:!0,valueStrings:["ON","OFF"]},animateNowPlayingIcon:{description:"Animate Playing Track Icon",type:i,values:[!0,!1],default:!0,valueStrings:["ON","OFF"]},autoResumePlayback:{description:"Auto Resume Playback on focus",type:i,values:[!0,!1],default:!1,valueStrings:["ON","OFF"]},trackCrossfadeDefPreset:{description:"Track Crossfade Def. Preset",type:o,values:[0,1,2,3,4,5],default:1,valueStrings:["10 sec EqPow (1)","20 sec EqPow (2)","30 sec EqPow (3)","10 sec Linear (4)","20 sec Linear (5)","30 sec Linear (6)"]},timeRemainingWarning:{description:"Time Remaining Warning",type:i,values:[!0,!1],default:!0,valueStrings:["ON","OFF"]},timeRemainingSeconds:{description:"Time Remaining Warning Seconds",type:o,values:[15,30,45,60],default:60,valueStrings:["15 sec","30 sec","45 sec","60 sec"]},autoExitFsOnWarning:{description:"Exit Fullscreen on Time Warning",type:i,values:[!0,!1],default:!0,valueStrings:["ON","OFF"]},keepMobileScreenOn:{description:"Keep Mobile Screen On when playing",type:i,values:[!0,!1],default:!1,valueStrings:["ON","OFF"]},trackTimesOnMobile:{description:"Show Track Times on mobile",type:i,values:[!0,!1],default:!1,valueStrings:["ON","OFF"]},trackThumbnailOnMobile:{description:"Show Track Thumbnail on mobile",type:i,values:[!0,!1],default:!0,valueStrings:["ON","OFF"]}},priv:{storageChangeSync:{description:"",type:i,values:[!0,!1],default:!1,valueStrings:[]},tips:{showLeftArrowHint:{description:"",type:i,values:[!0,!1],default:!0,valueStrings:[]},showRightArrowHint:{description:"",type:i,values:[!0,!1],default:!0,valueStrings:[]},showDetailsHint:{description:"",type:i,values:[!0,!1],default:!0,valueStrings:[]},showTrackImageHint:{description:"",type:i,values:[!0,!1],default:!0,valueStrings:[]}}}},me={version:n.version.default,user:{keyboardShortcuts:n.user.keyboardShortcuts.default,masterVolume:n.user.masterVolume.default,masterMute:n.user.masterMute.default,autoplay:n.user.autoplay.default,autoCrossfade:n.user.autoCrossfade.default,autoCrossfadeLength:n.user.autoCrossfadeLength.default,autoCrossfadeCurve:n.user.autoCrossfadeCurve.default,autoScroll:n.user.autoScroll.default,smoothScrolling:n.user.smoothScrolling.default,autoExitFullscreen:n.user.autoExitFullscreen.default,animateNowPlayingIcon:n.user.animateNowPlayingIcon.default,autoResumePlayback:n.user.autoResumePlayback.default,trackCrossfadeDefPreset:n.user.trackCrossfadeDefPreset.default,timeRemainingWarning:n.user.timeRemainingWarning.default,timeRemainingSeconds:n.user.timeRemainingSeconds.default,autoExitFsOnWarning:n.user.autoExitFsOnWarning.default,keepMobileScreenOn:n.user.keepMobileScreenOn.default,trackTimesOnMobile:n.user.trackTimesOnMobile.default,trackThumbnailOnMobile:n.user.trackThumbnailOnMobile.default},priv:{storageChangeSync:n.priv.storageChangeSync.default,tips:{showLeftArrowHint:n.priv.tips.showLeftArrowHint.default,showRightArrowHint:n.priv.tips.showRightArrowHint.default,showDetailsHint:n.priv.tips.showDetailsHint.default,showTrackImageHint:n.priv.tips.showTrackImageHint.default}}},m={version:{description:"",type:o,values:[1,999999],default:7,valueStrings:[]},user:{theme:{description:"Theme",type:p,values:["light","dark","auto"],default:"auto",valueStrings:["Light","Dark","Auto / System"]},trackLayout:{description:"Track Layout",type:p,values:["list","2-column","3-column"],default:"3-column",valueStrings:["List","2 Column","3 / 4 Column"]},tracksPerPage:{description:"Tracks Per Page for Search &amp; Shuffle",type:o,values:[...Array(22).keys()].map(t=>t+3),default:12,valueStrings:[...Array(22).keys()].map(t=>`${t+3}`)},keyboardShortcuts:{description:"Keyboard Shortcuts",type:i,values:[!0,!1],default:!0,valueStrings:["ON","OFF"]}},priv:{storageChangeSync:{description:"",type:i,values:[!0,!1],default:!1,valueStrings:[]},banners:{showFrontpageIntro:{description:"",type:i,values:[!0,!1],default:!0,valueStrings:[]},showPremiumIntro:{description:"",type:i,values:[!0,!1],default:!0,valueStrings:[]},showPromoIntro:{description:"",type:i,values:[!0,!1],default:!0,valueStrings:[]}}}},pe={version:m.version.default,user:{theme:m.user.theme.default,trackLayout:m.user.trackLayout.default,tracksPerPage:m.user.tracksPerPage.default,keyboardShortcuts:m.user.keyboardShortcuts.default},priv:{storageChangeSync:m.priv.storageChangeSync.default,banners:{showFrontpageIntro:m.priv.banners.showFrontpageIntro.default,showPremiumIntro:m.priv.banners.showPremiumIntro.default,showPromoIntro:m.priv.banners.showPromoIntro.default}}},d={version:{description:"",type:o,values:[1,999999],default:1,valueStrings:[]},crossfade:[{name:{description:"Preset 1",type:p,values:[5,50],default:"10 sec EqPow",valueStrings:[]},length:{description:"Crossfade Length",type:o,values:[5,10,15,20,25,30],default:10,valueStrings:["5 sec","10 sec","15 sec","20 sec","25 sec","30 sec"]},curve:{description:"Crossfade Curve",type:o,values:[0,1],default:0,valueStrings:["Equal Power","Linear"]}},{name:{description:"Preset 2",type:p,values:[5,50],default:"20 sec EqPow",valueStrings:[]},length:{description:"Crossfade Length",type:o,values:[5,10,15,20,25,30],default:20,valueStrings:["5 sec","10 sec","15 sec","20 sec","25 sec","30 sec"]},curve:{description:"Crossfade Curve",type:o,values:[0,1],default:0,valueStrings:["Equal Power","Linear"]}},{name:{description:"Preset 3",type:p,values:[5,50],default:"30 sec EqPow",valueStrings:[]},length:{description:"Crossfade Length",type:o,values:[5,10,15,20,25,30],default:30,valueStrings:["5 sec","10 sec","15 sec","20 sec","25 sec","30 sec"]},curve:{description:"Crossfade Curve",type:o,values:[0,1],default:0,valueStrings:["Equal Power","Linear"]}},{name:{description:"Preset 4",type:p,values:[5,50],default:"10 sec Linear",valueStrings:[]},length:{description:"Crossfade Length",type:o,values:[5,10,15,20,25,30],default:10,valueStrings:["5 sec","10 sec","15 sec","20 sec","25 sec","30 sec"]},curve:{description:"Crossfade Curve",type:o,values:[0,1],default:1,valueStrings:["Equal Power","Linear"]}},{name:{description:"Preset 5",type:p,values:[5,50],default:"20 sec Linear",valueStrings:[]},length:{description:"Crossfade Length",type:o,values:[5,10,15,20,25,30],default:20,valueStrings:["5 sec","10 sec","15 sec","20 sec","25 sec","30 sec"]},curve:{description:"Crossfade Curve",type:o,values:[0,1],default:1,valueStrings:["Equal Power","Linear"]}},{name:{description:"Preset 6",type:p,values:[5,50],default:"30 sec Linear",valueStrings:[]},length:{description:"Crossfade Length",type:o,values:[5,10,15,20,25,30],default:30,valueStrings:["5 sec","10 sec","15 sec","20 sec","25 sec","30 sec"]},curve:{description:"Crossfade Curve",type:o,values:[0,1],default:1,valueStrings:["Equal Power","Linear"]}}]},he={version:d.version.default,crossfade:[{name:d.crossfade[0].name.default,length:d.crossfade[0].length.default,curve:d.crossfade[0].curve.default},{name:d.crossfade[1].name.default,length:d.crossfade[1].length.default,curve:d.crossfade[1].curve.default},{name:d.crossfade[2].name.default,length:d.crossfade[2].length.default,curve:d.crossfade[2].curve.default},{name:d.crossfade[3].name.default,length:d.crossfade[3].length.default,curve:d.crossfade[3].curve.default},{name:d.crossfade[4].name.default,length:d.crossfade[4].length.default,curve:d.crossfade[4].curve.default},{name:d.crossfade[5].name.default,length:d.crossfade[5].length.default,curve:d.crossfade[5].curve.default}]};function E(t,e){let s=0;return r(t,e),s;function r(a,u){for(let c in a)if(a&&u&&typeof a[c]=="object"&&typeof u[c]=="object")r(a[c],u[c]);else if(u[c]!==void 0)H(a,u[c],a[c],c)&&s++;else throw`'${c}' ${typeof a[c]=="object"?"object":"property"} is not in schema`}}function H(t,e,s,r){switch(e.type){case o:if(Number.isInteger(s)===!1||s<e.values[0]||s>e.values[e.values.length-1])return P.warn(`validate() - '${r}' has invalid value: ${s} ('${r}' is type: INTEGER - min: ${e.values[0]} - max: ${e.values[e.values.length-1]}) -- setting default value: ${e.default}`),t[r]=e.default,!0;break;case i:if(s!==!0&&s!==!1)return P.warn(`validate() - '${r}' has invalid value: ${s} ('${r}' is type: BOOLEAN) -- setting default value: ${e.default}`),t[r]=e.default,!0;break;case p:if(typeof s!="string")return P.warn(`validate() - '${r}' has invalid value: ${s} ('${r}' is type: STRING) -- setting default value: ${e.default}`),t[r]=e.default,!0;break;default:return P.warn(`validate() - '${r}' has unknown type: ${e.type}`),!0}}var _=g("utils"),S={SITE_MIN_WIDTH_WIDE:1,SITE_MAX_WIDTH:2,SITE_MAX_WIDTH_MOBILE:3},j=window.matchMedia(`(min-width: ${T("--site-min-width-wide")})`),q=window.matchMedia(`(max-width: ${T("--site-max-width")})`),G=window.matchMedia(`(max-width: ${T("--site-max-width-mobile")})`);function be(t,e,s,r=null){document.querySelectorAll(t).forEach(u=>{u.addEventListener(e,c=>s(c,r))})}function T(t,e=document.documentElement){let s=getComputedStyle(e).getPropertyValue(t);return s.length!==0?s=s.replace(/'|"/g,"").trim():_.error(`getCssPropString(${t}): Returned CSS property string is empty`),s}function ye(t,e=document.documentElement){let s=T(t,e),r=NaN;return s.length!==0&&(r=parseInt(s)),isNaN(r)&&_.error(`getCssPropValue(${t}): Returned CSS property value is NaN`),r}function A(t){switch(t){case S.SITE_MIN_WIDTH_WIDE:return j.matches;case S.SITE_MAX_WIDTH:return q.matches;case S.SITE_MAX_WIDTH_MOBILE:return G.matches}return!1}function Pe(t,e,s){t.classList.remove(e),t.classList.add(s)}var Y=g("snackbar"),h={id:"snackbar"},J=`
  <div id="${h.id}">
    <div class="${h.id}-container">
      <div class="${h.id}-message"></div>
      <div class="${h.id}-action-button"></div>
      <div class="${h.id}-close-button"><span class="material-icons" title="Dismiss">close</span></div>
    </div>
  </div>
`,l={snackbar:null,actionButton:null,closeButton:null},w=0,N=null,b=null,I=-1,y=-1;function Ee(t,e=5,s=null,r=null,a=null){return Y.log(`showSnackbar(): ${t} (${e} sec.)`),X(),C(),l.snackbar.querySelector(`.${h.id}-message`).innerHTML=t,l.snackbar.classList.add("show"),l.actionButton.style.display="none",b=a,s!==null&&r!==null?(N=r,l.actionButton.style.display="block",l.actionButton.textContent=s,l.actionButton.addEventListener("click",x)):A(S.SITE_MAX_WIDTH_MOBILE)?l.closeButton.style.paddingLeft="10px":l.closeButton.style.paddingLeft="20px",e!==0&&(I=setTimeout(()=>{l.snackbar.classList.add("hide"),y=setTimeout(()=>{l.snackbar.className="",b!==null&&b()},450)},e*1e3)),++w}function X(){l.snackbar===null&&(document.body.insertAdjacentHTML("beforeend",J),l.snackbar=document.getElementById(h.id),l.actionButton=l.snackbar.querySelector(`.${h.id}-action-button`),l.closeButton=l.snackbar.querySelector(`.${h.id}-close-button`),l.closeButton.addEventListener("click",()=>{b!==null&&b(),C(!0)}))}function x(){N(),C(!0)}function Q(){return l.snackbar!==null&&l.snackbar.classList.length===1&&l.snackbar.classList.contains("show")}function we(t=0){Q()&&((w===0||w===t)&&(l.snackbar.classList.add("hide"),y=setTimeout(()=>l.snackbar.className="",450)))}function C(t=!1){I!==-1&&(clearTimeout(I),I=-1),y!==-1&&(clearTimeout(y),y=-1),l.actionButton.removeEventListener("click",x),t&&l.snackbar.classList.remove("show")}var f=g("storage"),R={},U={UF_AUTOPLAY:"UF_AUTOPLAY",UF_PLAYBACK_SETTINGS:"UF_PLAYBACK_SETTINGS",UF_SITE_SETTINGS:"UF_SITE_SETTINGS",UF_PRESET_LIST:"UF_PRESET_LIST",UF_SITE_THEME:"UF_SITE_THEME",UF_TRACK_LAYOUT:"UF_TRACK_LAYOUT",UF_TRACKS_PER_PAGE:"UF_TRACKS_PER_PAGE"};function K(t,e=null,s=!1){f.log(`readJson(): ${t} - ${e} - ${s}`);let r=localStorage.getItem(t),a=null;if(r===null)return s&&e!==null&&v(t,e),e;try{a=JSON.parse(r)}catch(u){f.error(u),e!==null&&(a=e)}return a}function v(t,e){f.log(`writeJson(): ${t} - ${e}`);try{localStorage.setItem(t,JSON.stringify(e))}catch(s){f.error(s)}}function z(t,e,s){f.log(`mergeSettings(): Merging ${s} from version ${t.version} to version ${e.version}`);let r={version:e.version};return L(t,e,r),V(r,e),r}function L(t,e,s){for(let r in e)typeof e[r]=="object"&&(t&&typeof t[r]=="object"?(f.log(`mergeDeep() - Merging: ${r}`),s[r]={...e[r],...t[r]},L(t[r],e[r],s[r])):(f.log(`mergeDeep() - Copying: ${r}`),s[r]={...e[r]},L({},e[r],s[r])))}function V(t,e){for(let s in t)s in e===!1&&(f.log(`cleanDeep() - Deleting: ${s} (${typeof t[s]=="object"?"object":"property"})`),delete t[s]),typeof t[s]=="object"&&V(t[s],e[s])}function Z(t,e,s){try{let r=0;switch(t){case U.UF_PLAYBACK_SETTINGS:r=E(e,n);break;case U.UF_SITE_SETTINGS:r=E(e,m);break}r>0&&v(t,e)}catch(r){return f.error(`validateSettings() exception: ${r} -- using default settings`),v(t,s),s}return e}function $e(t,e=null,s=!1){let r=K(t,e,s);if(r!==null&&e!==null&&r.version!==void 0){let a=r;return r.version<e.version&&(f.log(r),a=z(r,e,t),v(t,a),f.log(a)),D(t,Z(t,a,e))}return e!==null?(f.warn(`readWriteSettingsProxy() - Failed for: ${t} -- using default settings`),v(t,e),D(t,e)):(f.error(`readWriteSettingsProxy() - Fatal error for: ${t} -- unable to read settings!`),null)}var D=(t,e)=>{let s={get(r,a,u){if(a in r){let c=Reflect.get(r,a,u);return typeof c=="object"?new Proxy(c,s):c}f.error(`onSettingsChange(): Get unknown property: ${a}`)},set(r,a,u,c){if(a in r){let O=Reflect.get(r,a,c);return u!==O&&(Reflect.set(r,a,u),v(t,e),ee(a,O,u)),!0}return f.error(`onSettingsChange(): Set unknown property: ${a}`),!0}};return new Proxy(e,s)};function ee(t,e,s){t in R&&(f.log(`callSettingsObserver() for property: ${t} - oldValue: ${e} - newValue: ${s}`),R[t].forEach(r=>r(e,s)))}export{ae as a,ce as b,S as c,f as d,me as e,R as f,U as g,pe as h,he as i,be as j,Ee as k,T as l,ye as m,we as n,A as o,Pe as p,g as q,$e as r,de as s};
//# sourceMappingURL=chunk.IQHCOHFK.js.map
