import{a as pe,c as K,e as v,h as re,i as le,j as se,k as m,l as Y,m as R,n as te,o as ae,p as W,q as G,r as S,s as oe,t as ie}from"./chunk.A3OLUWH6.js";function x(e){let t;try{t=window[e];const n="__storage_test__";return t.setItem(n,n),t.removeItem(n),!0}catch(n){return n instanceof DOMException&&(n.code===22||n.code===1014||n.name==="QuotaExceededError"||n.name==="NS_ERROR_DOM_QUOTA_REACHED")&&t&&t.length!==0}}function O(e,t="",n=60*60*24*365,i="/"){document.cookie=`${e}=${t}; Max-Age=${n}; Path=${i}; Secure; SameSite=Strict`}function _(e,t){try{localStorage.setItem(e,t)}catch(n){pe.error(n)}}const V=S("modal"),h={id:"modal"},Q=`
  <div id="${h.id}-dialog" tabindex="-1">
    <div class="${h.id}-container">
      <div class="${h.id}-header">
        <div class="${h.id}-title"></div>
        <div class="${h.id}-close-button"><span class="material-icons" title="Dismiss">close</span></div>
      </div>
      <div class="${h.id}-body"></div>
    </div>
  </div>
`,r={overlay:null,container:null,body:null};let P=null;function A(e,t,n){V.log(`showModal(): ${e}`),X(),P=n,Z(t),r.container.querySelector(`.${h.id}-title`).innerHTML=e,r.overlay.classList.add("show"),r.overlay.addEventListener("keydown",H),r.overlay.focus(),U(!0)}function X(){r.container===null&&(document.body.insertAdjacentHTML("beforeend",Q),r.overlay=document.getElementById(`${h.id}-dialog`),r.container=r.overlay.querySelector(`.${h.id}-container`),r.body=r.overlay.querySelector(`.${h.id}-body`),r.overlay.addEventListener("click",e=>{e.target===r.overlay&&L()}),r.overlay.addEventListener("animationend",()=>{r.overlay.classList.contains("hide")&&(r.overlay.className="",U(!1))}),r.overlay.querySelector(`.${h.id}-close-button`).addEventListener("click",L))}function Z(e){let t="";e.forEach(n=>t+=`<div id="${n.id}" class="${h.id}-single-choice">${n.description}</div>`),r.body.innerHTML=t,e.forEach(n=>r.body.querySelector(`#${n.id}`).addEventListener("click",ee))}function ee(){L(),setTimeout(()=>P(this.id),150)}function H(e){e.stopPropagation(),e.key==="Escape"&&L()}function L(){r.overlay.removeEventListener("keydown",H),r.overlay.classList.replace("show","hide")}function U(e){const t=window.innerWidth-document.documentElement.clientWidth;document.body.style.overflow=e?"hidden":"",document.body.style.paddingRight=e?`${t}px`:"",document.getElementById("site-header").style.paddingRight=e?`${t}px`:""}const E=S("site-interaction");let b={};function D(e){E.log("init()"),b=e,ne.addEventListeners(),k.init(),T.init()}function F(e){b=e,k.setCurrent(),T.setCurrent()}const k=(()=>{let e={};const t={toggle:null},n={toggleId:"#footer-site-theme-toggle",prefDarkScheme:"(prefers-color-scheme: dark)"},i={light:{id:"light",text:"light",class:"site-theme-light"},dark:{id:"dark",text:"dark",class:"site-theme-dark"},auto:{id:"auto",text:"auto"}};return{init:a,setCurrent:l,toggle:d};function a(){t.toggle=document.querySelector(n.toggleId);const o=window.matchMedia(n.prefDarkScheme);o.addEventListener("change",c),m(n.toggleId,"click",d),l()}function l(){e=q(i,b.user.theme,i.auto),u()}function c(){e.id===i.auto.id&&u()}function d(o){o.preventDefault(),e=B(i,e),b.user.theme=e.id,u()}function u(){let o=e;e.id===i.auto.id&&(o=window.matchMedia(n.prefDarkScheme).matches?i.dark:i.light),_(v.UF_SITE_THEME,o.id),p(o)}function p(o){document.documentElement.classList.contains(o.class)===!1&&(E.log(`updateDOM() - newSiteTheme: ${o.id}`),document.documentElement.classList.remove(i.light.class,i.dark.class),document.documentElement.classList.add(o.class)),t.toggle.querySelector("span").textContent=e.text}})(),T=(()=>{let e={};const t={toggle:null},n={toggleId:"#footer-track-layout-toggle",minWidth:`(max-width: ${te("--site-content-track-layout-min-width")})`},i={list:{id:"list",text:"list",class:"track-layout-list"},twoColumn:{id:"2-column",text:"2 column",class:"track-layout-2-column"},threeColumn:{id:"3-column",text:"3 / 4 column",class:"track-layout-3-column"}};return{init:a,setCurrent:l,toggle:d};function a(){t.toggle=document.querySelector(n.toggleId);const o=window.matchMedia(n.minWidth);o.addEventListener("change",c),m(n.toggleId,"click",d),l()}function l(){e=q(i,b.user.trackLayout,i.threeColumn),t.toggle.querySelector("span").textContent=e.text,u()}function c(o){o.matches?document.documentElement.classList.remove(e.class):document.documentElement.classList.add(e.class)}function d(o,I=!1){o.preventDefault(),e=B(i,e),b.user.trackLayout=e.id,u(),I&&t.toggle.scrollIntoView()}function u(){_(v.UF_TRACK_LAYOUT,e.id),p()}function p(){document.documentElement.classList.contains(e.class)===!1&&(E.log(`updateDOM() - newTrackLayout: ${e.id}`),document.documentElement.classList.remove(i.list.class,i.twoColumn.class,i.threeColumn.class),window.matchMedia(n.minWidth).matches===!1&&document.documentElement.classList.add(e.class),t.toggle.querySelector("span").textContent=e.text)}})();function q(e,t,n){const i=Object.values(e).find(a=>a.id===t);return i!==void 0?i:n}function B(e,t){const n=Object.values(e).findIndex(a=>a.id===t.id),i=Object.keys(e);return n+1<i.length?e[i[n+1]]:e[i[0]]}const ne=(()=>{let e=null,t=null;const n=/\s{1,}[–·-]\s{1,}/i,i=[{id:"copyToClipboard",description:"<b>Copy Link</b> to Clipboard"},{id:"shareOnEmail",description:"<b>Share</b> on Email"},{id:"playOnAmazonMusic",description:"<b>Play</b> on Amazon Music"},{id:"playOnAppleMusic",description:"<b>Play</b> on Apple Music"},{id:"playOnSpotify",description:"<b>Play</b> on Spotify"},{id:"playOnTidal",description:"<b>Play</b> on Tidal"},{id:"playOnYouTubeMusic",description:"<b>Play</b> on YouTube Music"}];return{addEventListeners:a,click:l};function a(){m(".entry-meta-controls .track-share-control","click",l)}function l(d){e=d.target.getAttribute("data-entry-track-title"),t=d.target.getAttribute("data-entry-track-url"),A("Share / Play Track",i,c)}function c(d){E.log(`singleChoiceListClick(): ${d} - trackTitle: ${e} - trackUrl: ${t}`);const u=encodeURIComponent(e.replace(n," "));switch(d){case"copyToClipboard":navigator.clipboard.writeText(t).then(()=>{R("Track link copied to the clipboard",3)},p=>{E.error(`trackShare.copyToClipboard() failed because ${p}`),R("Failed to copy Track link to the clipboard",5)});break;case"shareOnEmail":window.location.href=`mailto:?subject=${encodeURIComponent(e)}&body=${t}%0d%0a`;break;case"playOnAmazonMusic":window.open(`https://music.amazon.com/search/${u}`,"_blank");break;case"playOnAppleMusic":window.open(`https://music.apple.com/ca/search?term=${u}`,"_blank");break;case"playOnSpotify":window.open(`https://open.spotify.com/search/${u}`,"_blank");break;case"playOnTidal":window.open(`https://google.com/search?q=${u}%20site:tidal.com`,"_blank");break;case"playOnYouTubeMusic":window.open(`https://music.youtube.com/search?q=${u}`,"_blank");break}}})(),w=S("index");let g={};const ce={smoothScrolling:!1,settingsUpdatedEvent:"settingsUpdated"},s={siteHeader:null,introBanner:null,siteContent:null,siteContentSearch:null};document.addEventListener("DOMContentLoaded",()=>{w.log("DOMContentLoaded"),$(),de(),s.introBanner!==null&&ue(),document.querySelector("#site-content form.search-form")!==null&&(s.siteContentSearch.focus(),s.siteContentSearch.setSelectionRange(9999,9999)),f.setTopMargin(),f.setLastInnerWidth(window.innerWidth),ge()});document.addEventListener(ce.settingsUpdatedEvent,()=>{$(),F(g),O(v.UF_TRACKS_PER_PAGE,g.user.tracksPerPage,60*60*24*365*5)});window.addEventListener("load",()=>f.setTopMargin());window.addEventListener("storage",he);function $(){w.log("readSettings()"),g=oe(v.UF_SITE_SETTINGS,se,!0),Y(g.user,re),Y(g.priv.banners,le),w.log(g)}function de(){w.log("initIndex()"),s.siteHeader=document.getElementById("site-header"),s.introBanner=document.getElementById("intro-banner"),s.siteContent=document.getElementById("site-content"),s.siteContentSearch=document.querySelector("#site-content form input.search-field"),f.addEventListener(),fe.addEventListener(),D(g),C.init(),y.init()}document.addEventListener("keydown",e=>{if(e.ctrlKey===!1&&e.altKey===!1)switch(e.key){case"Escape":y.isVisible()&&(e.preventDefault(),y.toggle());return}if(g.user.keyboardShortcuts&&e.ctrlKey===!1&&e.altKey===!1)switch(e.key){case"c":case"C":M()&&(e.preventDefault(),y.toggle());break;case"L":M()&&N()&&(T.toggle(e,!1),f.setTopMargin());break;case"s":case"S":M()&&(e.preventDefault(),C.toggle());break;case"T":M()&&N()&&k.toggle(e);break}});function M(){return C.isVisible()===!1&&s.siteContentSearch!==document.activeElement}function N(){return document.body.classList.contains("page-template-page-settings")===!1}function he(e){if(g.storageChangeSync){const t=ie(e,v.UF_SITE_SETTINGS);t!==null&&(w.log(`windowEventStorage(): ${e.key}`),$(),g.user.theme!==t.user.theme&&k.setCurrent(),g.user.trackLayout!==t.user.trackLayout&&T.setCurrent())}}function ue(){x("localStorage")&&(typeof bannerProperty!="undefined"&&bannerProperty!==null&&(g.priv.banners[bannerProperty]&&(s.introBanner.style.display="block",m("#intro-banner .intro-banner-close-button","click",()=>{s.introBanner.style.display="",f.setTopMargin(),g.priv.banners[bannerProperty]=!1}))))}function ge(){if(document.querySelector(".nav-bar-title .go-back-to")!==null){let e="";if(document.referrer.length===0)e="Previous Page";else{const t=new URL(decodeURIComponent(document.referrer));if(t.search.length!==0)e="Search Results";else if(t.pathname.length>1){const n=t.pathname.slice(-1)==="/"?1:0,i=t.pathname.slice(1,t.pathname.length-n).replace(/-/gi," ").split("/");i.forEach((a,l)=>e+=l+1<i.length?a+" / ":a)}}document.querySelectorAll("#site-navigation .nav-bar-title").forEach(t=>{t.querySelector(".go-back-title").textContent=e.length>0?e:"Ultrafunk (home)",t.querySelector(".go-back-to").style.opacity=1})}}const y=(()=>{const e=new ResizeObserver(l),t={navMenu:null,modalOverlay:null};let n=!1;return{isVisible(){return n},scrolledTop(){t.navMenu.style.display=""},init:i,toggle:a};function i(){t.navMenu=document.querySelector("#site-navigation .nav-menu-outer"),t.modalOverlay=document.getElementById("nav-menu-modal-overlay"),m(".nav-menu-toggle","click",a),t.modalOverlay.addEventListener("click",a),t.modalOverlay.addEventListener("transitionend",c),e.observe(t.navMenu.querySelector(".menu-primary-menu-container"))}function a(){s.siteHeader.classList.contains("sticky-nav-up")?n?t.navMenu.style.display="none":t.navMenu.style.display="flex":s.siteHeader.classList.contains("sticky-nav-down")===!1&&s.siteHeader.classList.toggle("hide-nav-menu")}function l(d){n=d[0].contentRect.height!==0,n?(t.modalOverlay.className="",t.modalOverlay.classList.add("show"),setTimeout(()=>t.modalOverlay.classList.add("fadein"),50)):t.modalOverlay.classList.add("fadeout")}function c(){n===!1&&(t.modalOverlay.className="",t.navMenu.style.display="")}})(),C=(()=>{const e=new Event("allowKeyboardShortcuts"),t=new Event("denyKeyboardShortcuts"),n={searchContainer:null,searchField:null,brandingContainer:null};let i=!1;return{isVisible(){return i},init:a,toggle:l,hide:c};function a(){n.searchContainer=document.getElementById("search-container"),n.searchField=n.searchContainer.querySelector(".search-field"),n.brandingContainer=s.siteHeader.querySelector("div.site-branding-container"),m(".nav-search-toggle","click",l),m(".nav-search-toggle","mousedown",o=>o.preventDefault()),n.searchField.addEventListener("blur",c),n.searchField.addEventListener("keydown",o=>{o.key==="Escape"&&(o.stopPropagation(),c())})}function l(){if(n.searchContainer.style.display.length===0){if(W(K.SITE_MAX_WIDTH_MOBILE)&&(s.siteHeader.querySelector(".nav-bar-container-mobile-top").offsetHeight===0&&s.siteHeader.querySelector(".nav-bar-container-mobile-up").offsetHeight===0))return;d()}else c()}function c(){i&&u(!1,e,"","search")}function d(){p(),u(!0,t,"flex","clear"),n.searchField.focus(),n.searchField.setSelectionRange(9999,9999)}function u(o,I,J,j){i=o,document.dispatchEvent(I),n.searchContainer.style.display=J,document.querySelectorAll("div.nav-search-toggle i").forEach(z=>z.textContent=j)}function p(){let o=DOMRect;W(K.SITE_MAX_WIDTH_MOBILE)?(n.brandingContainer.offsetHeight!==0?o.top=n.brandingContainer.offsetTop:o.top=s.siteHeader.querySelector(".nav-bar-container-mobile-up").offsetTop,o.top+=3,o.left=63,o.right=document.body.clientWidth-63,o.height=30):o=n.brandingContainer.getBoundingClientRect(),n.searchContainer.style.top=`${o.top}px`,n.searchContainer.style.left=`${o.left}px`,n.searchContainer.style.width=`${o.right-o.left}px`,n.searchContainer.style.height=`${o.height}px`}})(),f=(()=>{let e=0,t=0;return{getHeaderHeight(){return e},setLastInnerWidth(a){t=a},addEventListener:n,setTopMargin:i};function n(){window.addEventListener("resize",()=>{const a=window.innerWidth;t!==a&&(i(),t=a)})}function i(){const a=ae("--site-content-margin-top");s.siteHeader.classList.contains("hide-nav-menu")&&(e=s.siteHeader.offsetHeight),s.introBanner!==null&&s.introBanner.style.display.length!==0?(s.introBanner.style.marginTop=`${e}px`,s.siteContent.style.marginTop=`${a}px`):s.siteContent.style.marginTop=`${e+a}px`}})(),fe=(()=>{let e=0,t=!1;return{addEventListener:n};function n(){window.addEventListener("scroll",()=>{const c=window.pageYOffset,d=Math.round(f.getHeaderHeight()>150?f.getHeaderHeight()/2:f.getHeaderHeight()/3);c<1?i():c>d&&c>e?a():l(),C.hide(),e=c})}function i(){s.siteHeader.classList.remove("sticky-nav-down","sticky-nav-up"),s.siteHeader.classList.add("hide-nav-menu"),y.scrolledTop(),f.setTopMargin()}function a(){t===!1&&(t=!0,G(s.siteHeader,"sticky-nav-up","sticky-nav-down"))}function l(){t===!0&&(t=!1,G(s.siteHeader,"sticky-nav-down","sticky-nav-up")),y.isVisible()&&y.toggle()}})();
//# sourceMappingURL=index.js.map
