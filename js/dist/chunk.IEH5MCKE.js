var $=!1,w=class{constructor(e="unknown"){this.moduleName=B(e.toUpperCase(),20,".")}isDebug(){return $}warn(e){console.warn(`${this.moduleName}:`,e)}error(e){console.error(`${this.moduleName}:`,e)}},_=class extends w{constructor(e){super(e)}log(e){console.log(`${this.moduleName}:`,e)}logEventLog(e,a,s){let r=[];for(let l=0;l<e.length;l++){let c={eventSource:this.getObjectKeyForValue(a,e[l].eventSource),eventType:this.getObjectKeyForValue(s,e[l].eventType),uId:e[l].uId,timeStamp:e[l].timeStamp};r.push(c)}this.log(r)}getObjectKeyForValue(e,a){return Object.keys(e).find(s=>e[s]===a)}},F=class extends w{constructor(e){super(e)}log(){}logEventLog(){}getObjectKeyForValue(){}};function m(t){return $===!0?new _(t):new F(t)}function B(t,e,a){return t.length>e?t.slice(0,e):t.padEnd(e,a)}var T=m("settings"),i=1,o=2,g=3,n={version:{description:"",type:i,values:[1,999999],default:26,valueStrings:[]},user:{keyboardShortcuts:{description:"Keyboard Shortcuts",type:o,values:[!0,!1],default:!0,valueStrings:["ON","OFF"]},masterVolume:{description:"Master Volume",type:i,values:[0,25,50,75,100],default:100,valueStrings:["0%","25%","50%","75%","100%"]},masterMute:{description:"Master Mute",type:o,values:[!0,!1],default:!1,valueStrings:["ON","OFF"]},autoplay:{description:"Autoplay next track",type:o,values:[!0,!1],default:!0,valueStrings:["ON","OFF"]},autoCrossfade:{description:"Auto Crossfade to next track",type:o,values:[!0,!1],default:!1,valueStrings:["ON","OFF"]},autoCrossfadeLength:{description:"Auto Crossfade Length",type:i,values:[5,10,15,20,25,30],default:20,valueStrings:["5 sec","10 sec","15 sec","20 sec","25 sec","30 sec"]},autoCrossfadeCurve:{description:"Auto Crossfade Curve",type:i,values:[0,1],default:1,valueStrings:["Equal Power","Linear"]},autoScroll:{description:"Autoscroll to next track",type:o,values:[!0,!1],default:!0,valueStrings:["ON","OFF"]},smoothScrolling:{description:"Smooth Scrolling to next track",type:o,values:[!0,!1],default:!0,valueStrings:["ON","OFF"]},autoExitFullscreen:{description:"Exit Fullscreen on next track",type:o,values:[!0,!1],default:!0,valueStrings:["ON","OFF"]},animateNowPlayingIcon:{description:"Animate Playing Track Icon",type:o,values:[!0,!1],default:!0,valueStrings:["ON","OFF"]},autoResumePlayback:{description:"Auto Resume Playback on focus",type:o,values:[!0,!1],default:!1,valueStrings:["ON","OFF"]},trackCrossfadeDefPreset:{description:"Track Crossfade Def. Preset",type:i,values:[0,1,2,3,4,5],default:1,valueStrings:["10 sec EqPow (1)","20 sec EqPow (2)","30 sec EqPow (3)","10 sec Linear (4)","20 sec Linear (5)","30 sec Linear (6)"]},timeRemainingWarning:{description:"Time Remaining Warning",type:o,values:[!0,!1],default:!0,valueStrings:["ON","OFF"]},timeRemainingSeconds:{description:"Time Remaining Warning Seconds",type:i,values:[15,30,45,60],default:60,valueStrings:["15 sec","30 sec","45 sec","60 sec"]},autoExitFsOnWarning:{description:"Exit Fullscreen on Time Warning",type:o,values:[!0,!1],default:!0,valueStrings:["ON","OFF"]},keepMobileScreenOn:{description:"Keep Mobile Screen On when playing",type:o,values:[!0,!1],default:!1,valueStrings:["ON","OFF"]},trackTimesOnMobile:{description:"Show Track Times on mobile",type:o,values:[!0,!1],default:!1,valueStrings:["ON","OFF"]},trackThumbnailOnMobile:{description:"Show Track Thumbnail on mobile",type:o,values:[!0,!1],default:!0,valueStrings:["ON","OFF"]}},priv:{storageChangeSync:{description:"",type:o,values:[!0,!1],default:!1,valueStrings:[]},tips:{showLeftArrowHint:{description:"",type:o,values:[!0,!1],default:!0,valueStrings:[]},showRightArrowHint:{description:"",type:o,values:[!0,!1],default:!0,valueStrings:[]},showDetailsHint:{description:"",type:o,values:[!0,!1],default:!0,valueStrings:[]},showTrackImageHint:{description:"",type:o,values:[!0,!1],default:!0,valueStrings:[]}}}},ae={version:n.version.default,user:{keyboardShortcuts:n.user.keyboardShortcuts.default,masterVolume:n.user.masterVolume.default,masterMute:n.user.masterMute.default,autoplay:n.user.autoplay.default,autoCrossfade:n.user.autoCrossfade.default,autoCrossfadeLength:n.user.autoCrossfadeLength.default,autoCrossfadeCurve:n.user.autoCrossfadeCurve.default,autoScroll:n.user.autoScroll.default,smoothScrolling:n.user.smoothScrolling.default,autoExitFullscreen:n.user.autoExitFullscreen.default,animateNowPlayingIcon:n.user.animateNowPlayingIcon.default,autoResumePlayback:n.user.autoResumePlayback.default,trackCrossfadeDefPreset:n.user.trackCrossfadeDefPreset.default,timeRemainingWarning:n.user.timeRemainingWarning.default,timeRemainingSeconds:n.user.timeRemainingSeconds.default,autoExitFsOnWarning:n.user.autoExitFsOnWarning.default,keepMobileScreenOn:n.user.keepMobileScreenOn.default,trackTimesOnMobile:n.user.trackTimesOnMobile.default,trackThumbnailOnMobile:n.user.trackThumbnailOnMobile.default},priv:{storageChangeSync:n.priv.storageChangeSync.default,tips:{showLeftArrowHint:n.priv.tips.showLeftArrowHint.default,showRightArrowHint:n.priv.tips.showRightArrowHint.default,showDetailsHint:n.priv.tips.showDetailsHint.default,showTrackImageHint:n.priv.tips.showTrackImageHint.default}}},v={version:{description:"",type:i,values:[1,999999],default:7,valueStrings:[]},user:{theme:{description:"Theme",type:g,values:["light","dark","auto"],default:"auto",valueStrings:["Light","Dark","Auto / System"]},trackLayout:{description:"Track Layout",type:g,values:["list","2-column","3-column"],default:"3-column",valueStrings:["List","2 Column","3 / 4 Column"]},tracksPerPage:{description:"Tracks Per Page for Search &amp; Shuffle",type:i,values:[...Array(22).keys()].map(t=>t+3),default:12,valueStrings:[...Array(22).keys()].map(t=>`${t+3}`)},keyboardShortcuts:{description:"Keyboard Shortcuts",type:o,values:[!0,!1],default:!0,valueStrings:["ON","OFF"]}},priv:{storageChangeSync:{description:"",type:o,values:[!0,!1],default:!1,valueStrings:[]},banners:{showFrontpageIntro:{description:"",type:o,values:[!0,!1],default:!0,valueStrings:[]},showPremiumIntro:{description:"",type:o,values:[!0,!1],default:!0,valueStrings:[]},showPromoIntro:{description:"",type:o,values:[!0,!1],default:!0,valueStrings:[]}}}},re={version:v.version.default,user:{theme:v.user.theme.default,trackLayout:v.user.trackLayout.default,tracksPerPage:v.user.tracksPerPage.default,keyboardShortcuts:v.user.keyboardShortcuts.default},priv:{storageChangeSync:v.priv.storageChangeSync.default,banners:{showFrontpageIntro:v.priv.banners.showFrontpageIntro.default,showPremiumIntro:v.priv.banners.showPremiumIntro.default,showPromoIntro:v.priv.banners.showPromoIntro.default}}},d={version:{description:"",type:i,values:[1,999999],default:1,valueStrings:[]},crossfade:[{name:{description:"Preset 1",type:g,values:[5,50],default:"10 sec EqPow",valueStrings:[]},length:{description:"Crossfade Length",type:i,values:[5,10,15,20,25,30],default:10,valueStrings:["5 sec","10 sec","15 sec","20 sec","25 sec","30 sec"]},curve:{description:"Crossfade Curve",type:i,values:[0,1],default:0,valueStrings:["Equal Power","Linear"]}},{name:{description:"Preset 2",type:g,values:[5,50],default:"20 sec EqPow",valueStrings:[]},length:{description:"Crossfade Length",type:i,values:[5,10,15,20,25,30],default:20,valueStrings:["5 sec","10 sec","15 sec","20 sec","25 sec","30 sec"]},curve:{description:"Crossfade Curve",type:i,values:[0,1],default:0,valueStrings:["Equal Power","Linear"]}},{name:{description:"Preset 3",type:g,values:[5,50],default:"30 sec EqPow",valueStrings:[]},length:{description:"Crossfade Length",type:i,values:[5,10,15,20,25,30],default:30,valueStrings:["5 sec","10 sec","15 sec","20 sec","25 sec","30 sec"]},curve:{description:"Crossfade Curve",type:i,values:[0,1],default:0,valueStrings:["Equal Power","Linear"]}},{name:{description:"Preset 4",type:g,values:[5,50],default:"10 sec Linear",valueStrings:[]},length:{description:"Crossfade Length",type:i,values:[5,10,15,20,25,30],default:10,valueStrings:["5 sec","10 sec","15 sec","20 sec","25 sec","30 sec"]},curve:{description:"Crossfade Curve",type:i,values:[0,1],default:1,valueStrings:["Equal Power","Linear"]}},{name:{description:"Preset 5",type:g,values:[5,50],default:"20 sec Linear",valueStrings:[]},length:{description:"Crossfade Length",type:i,values:[5,10,15,20,25,30],default:20,valueStrings:["5 sec","10 sec","15 sec","20 sec","25 sec","30 sec"]},curve:{description:"Crossfade Curve",type:i,values:[0,1],default:1,valueStrings:["Equal Power","Linear"]}},{name:{description:"Preset 6",type:g,values:[5,50],default:"30 sec Linear",valueStrings:[]},length:{description:"Crossfade Length",type:i,values:[5,10,15,20,25,30],default:30,valueStrings:["5 sec","10 sec","15 sec","20 sec","25 sec","30 sec"]},curve:{description:"Crossfade Curve",type:i,values:[0,1],default:1,valueStrings:["Equal Power","Linear"]}}]},ne={version:d.version.default,crossfade:[{name:d.crossfade[0].name.default,length:d.crossfade[0].length.default,curve:d.crossfade[0].curve.default},{name:d.crossfade[1].name.default,length:d.crossfade[1].length.default,curve:d.crossfade[1].curve.default},{name:d.crossfade[2].name.default,length:d.crossfade[2].length.default,curve:d.crossfade[2].curve.default},{name:d.crossfade[3].name.default,length:d.crossfade[3].length.default,curve:d.crossfade[3].curve.default},{name:d.crossfade[4].name.default,length:d.crossfade[4].length.default,curve:d.crossfade[4].curve.default},{name:d.crossfade[5].name.default,length:d.crossfade[5].length.default,curve:d.crossfade[5].curve.default}]};function C(t,e){let a=0;return s(t,e),a;function s(r,l){for(let c in r)if(r&&l&&typeof r[c]=="object"&&typeof l[c]=="object")s(r[c],l[c]);else if(l[c]!==void 0)W(r,l[c],r[c],c)&&a++;else throw`'${c}' ${typeof r[c]=="object"?"object":"property"} is not in schema`}}function W(t,e,a,s){switch(e.type){case i:if(Number.isInteger(a)===!1||a<e.values[0]||a>e.values[e.values.length-1])return T.warn(`validate() - '${s}' has invalid value: ${a} ('${s}' is type: INTEGER - min: ${e.values[0]} - max: ${e.values[e.values.length-1]}) -- setting default value: ${e.default}`),t[s]=e.default,!0;break;case o:if(a!==!0&&a!==!1)return T.warn(`validate() - '${s}' has invalid value: ${a} ('${s}' is type: BOOLEAN) -- setting default value: ${e.default}`),t[s]=e.default,!0;break;case g:if(typeof a!="string")return T.warn(`validate() - '${s}' has invalid value: ${a} ('${s}' is type: STRING) -- setting default value: ${e.default}`),t[s]=e.default,!0;break;default:return T.warn(`validate() - '${s}' has unknown type: ${e.type}`),!0}}var A=m("utils"),h={SITE_MIN_WIDTH_WIDE:1,SITE_MAX_WIDTH:2,SITE_MAX_WIDTH_MOBILE:3},G=window.matchMedia(`(min-width: ${k("--site-min-width-wide")})`),j=window.matchMedia(`(max-width: ${k("--site-max-width")})`),q=window.matchMedia(`(max-width: ${k("--site-max-width-mobile")})`);function le(t,e,a,s=null){document.querySelectorAll(t).forEach(l=>{l.addEventListener(e,c=>a(c,s))})}function k(t,e=document.documentElement){let a=getComputedStyle(e).getPropertyValue(t);return a.length!==0?a=a.replace(/'|"/g,"").trim():A.error(`getCssPropString(${t}): Returned CSS property string is empty`),a}function ie(t,e=document.documentElement){let a=k(t,e),s=NaN;return a.length!==0&&(s=parseInt(a)),isNaN(s)&&A.error(`getCssPropValue(${t}): Returned CSS property value is NaN`),s}function M(t){switch(t){case h.SITE_MIN_WIDTH_WIDE:return G.matches;case h.SITE_MAX_WIDTH:return j.matches;case h.SITE_MAX_WIDTH_MOBILE:return q.matches}return!1}function ce(t,e,a){t.classList.remove(e),t.classList.add(a)}var Y=m("snackbar"),p={id:"snackbar"},J=`
  <div id="${p.id}">
    <div class="${p.id}-container">
      <div class="${p.id}-message"></div>
      <div class="${p.id}-action-button"></div>
      <div class="${p.id}-close-button"><span class="material-icons" title="Dismiss">close</span></div>
    </div>
  </div>
`,u={snackbar:null,actionButton:null,closeButton:null},I=0,N=null,b=null,E=-1,y=-1;function ge(t,e=5,a=null,s=null,r=null){return Y.log(`showSnackbar(): ${t} (${e} sec.)`),X(),L(),u.snackbar.querySelector(`.${p.id}-message`).innerHTML=t,u.snackbar.classList.add("show"),u.actionButton.style.display="none",b=r,a!==null&&s!==null?(N=s,u.actionButton.style.display="block",u.actionButton.textContent=a,u.actionButton.addEventListener("click",x)):M(h.SITE_MAX_WIDTH_MOBILE)?u.closeButton.style.paddingLeft="10px":u.closeButton.style.paddingLeft="20px",e!==0&&(E=setTimeout(()=>{u.snackbar.classList.add("hide"),y=setTimeout(()=>{u.snackbar.className="",b!==null&&b()},450)},e*1e3)),++I}function X(){u.snackbar===null&&(document.body.insertAdjacentHTML("beforeend",J),u.snackbar=document.getElementById(p.id),u.actionButton=u.snackbar.querySelector(`.${p.id}-action-button`),u.closeButton=u.snackbar.querySelector(`.${p.id}-close-button`),u.closeButton.addEventListener("click",()=>{b!==null&&b(),L(!0)}))}function x(){N(),L(!0)}function Q(){return u.snackbar!==null&&u.snackbar.classList.length===1&&u.snackbar.classList.contains("show")}function pe(t=0){Q()&&((I===0||I===t)&&(u.snackbar.classList.add("hide"),y=setTimeout(()=>u.snackbar.className="",450)))}function L(t=!1){E!==-1&&(clearTimeout(E),E=-1),y!==-1&&(clearTimeout(y),y=-1),u.actionButton.removeEventListener("click",x),t&&u.snackbar.classList.remove("show")}var f=m("storage"),R={},D={UF_AUTOPLAY:"UF_AUTOPLAY",UF_PLAYBACK_SETTINGS:"UF_PLAYBACK_SETTINGS",UF_SITE_SETTINGS:"UF_SITE_SETTINGS",UF_PRESET_LIST:"UF_PRESET_LIST",UF_SITE_THEME:"UF_SITE_THEME",UF_TRACK_LAYOUT:"UF_TRACK_LAYOUT",UF_TRACKS_PER_PAGE:"UF_TRACKS_PER_PAGE"};function z(t,e=null,a=!1){f.log(`readJson(): ${t} - ${e} - ${a}`);let s=localStorage.getItem(t),r=null;if(s===null)return a&&e!==null&&S(t,e),e;try{r=JSON.parse(s)}catch(l){f.error(l),e!==null&&(r=e)}return r}function S(t,e){f.log(`writeJson(): ${t} - ${e}`);try{localStorage.setItem(t,JSON.stringify(e))}catch(a){f.error(a)}}function V(t,e,a){f.log(`mergeSettings(): Merging ${a} from version ${t.version} to version ${e.version}`);let s={version:e.version};return O(t,e,s),U(s,e),s}function O(t,e,a){for(let s in e)typeof e[s]=="object"&&(t&&typeof t[s]=="object"?(f.log(`mergeDeep() - Merging: ${s}`),a[s]={...e[s],...t[s]},O(t[s],e[s],a[s])):(f.log(`mergeDeep() - Copying: ${s}`),a[s]={...e[s]},O({},e[s],a[s])))}function U(t,e){for(let a in t)a in e===!1&&(f.log(`cleanDeep() - Deleting: ${a} (${typeof t[a]=="object"?"object":"property"})`),delete t[a]),typeof t[a]=="object"&&U(t[a],e[a])}function Z(t,e,a){try{let s=0;switch(t){case D.UF_PLAYBACK_SETTINGS:s=C(e,n);break;case D.UF_SITE_SETTINGS:s=C(e,v);break}s>0&&S(t,e)}catch(s){return f.error(`validateSettings() exception: ${s} -- using default settings`),S(t,a),a}return e}function be(t,e=null,a=!1){let s=z(t,e,a);if(s!==null&&e!==null&&s.version!==void 0){let r=s;return s.version<e.version&&(f.log(s),r=V(s,e,t),S(t,r),f.log(r)),H(t,Z(t,r,e))}return e!==null?(f.warn(`readWriteSettingsProxy() - Failed for: ${t} -- using default settings`),S(t,e),H(t,e)):(f.error(`readWriteSettingsProxy() - Fatal error for: ${t} -- unable to read settings!`),null)}var H=(t,e)=>{let a={get(s,r,l){if(r in s){let c=Reflect.get(s,r,l);return typeof c=="object"?new Proxy(c,a):c}f.error(`onSettingsChange(): Get unknown property: ${r}`)},set(s,r,l,c){if(r in s){let P=Reflect.get(s,r,c);return l!==P&&(Reflect.set(s,r,l),S(t,e),K(r,P,l)),!0}return f.error(`onSettingsChange(): Set unknown property: ${r}`),!0}};return new Proxy(e,a)};function K(t,e,a){t in R&&(f.log(`callSettingsObserver() for property: ${t} - oldValue: ${e} - newValue: ${a}`),R[t].forEach(s=>s(e,a)))}export{h as a,f as b,ae as c,R as d,D as e,re as f,ne as g,le as h,ge as i,k as j,ie as k,pe as l,M as m,ce as n,m as o,be as p};
//# sourceMappingURL=chunk.YQ6SW25X.js.map
