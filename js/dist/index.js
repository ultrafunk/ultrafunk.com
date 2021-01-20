import{c as oe,d as qe,g as f,h as Ue,j as v,k as N,l as be,m as R,o as re,p as I,q as b,r as Ae,s as Se,t as Ee}from"./chunk.3BM3N373.js";function F(e){let t;try{t=window[e];let n="__storage_test__";return t.setItem(n,n),t.removeItem(n),!0}catch(n){return n instanceof DOMException&&(n.code===22||n.code===1014||n.name==="QuotaExceededError"||n.name==="NS_ERROR_DOM_QUOTA_REACHED")&&t&&t.length!==0}}function j(e,t="",n=60*60*24*365,i="/"){document.cookie=`${e}=${t}; Max-Age=${n}; Path=${i}; Secure; SameSite=Strict`}function U(e,t){try{localStorage.setItem(e,t)}catch(n){qe.error(n)}}var fe=b("modal"),p={id:"modal"},he=`
  <div id="${p.id}-dialog" tabindex="-1">
    <div class="${p.id}-container">
      <div class="${p.id}-header">
        <div class="${p.id}-title"></div>
        <div class="${p.id}-close-button"><span class="material-icons" title="Dismiss">close</span></div>
      </div>
      <div class="${p.id}-body"></div>
    </div>
  </div>
`,d={overlay:null,container:null,body:null},q=null;function Y(e,t,n){fe.log(`showModal(): ${e}`),me(),q=n,pe(t),d.container.querySelector(`.${p.id}-title`).innerHTML=e,d.overlay.classList.add("show"),d.overlay.addEventListener("keydown",D),d.overlay.focus(),B(!0)}function me(){d.container===null&&(document.body.insertAdjacentHTML("beforeend",he),d.overlay=document.getElementById(`${p.id}-dialog`),d.container=d.overlay.querySelector(`.${p.id}-container`),d.body=d.overlay.querySelector(`.${p.id}-body`),d.overlay.addEventListener("click",e=>{e.target===d.overlay&&L()}),d.overlay.addEventListener("animationend",()=>{d.overlay.classList.contains("hide")&&(d.overlay.className="",B(!1))}),d.overlay.querySelector(`.${p.id}-close-button`).addEventListener("click",L))}function pe(e){let t="";e.forEach(n=>t+=`<div id="${n.id}" class="${p.id}-single-choice">${n.description}</div>`),d.body.innerHTML=t,e.forEach(n=>d.body.querySelector(`#${n.id}`).addEventListener("click",ye))}function ye(){L(),setTimeout(()=>q(this.id),150)}function D(e){e.stopPropagation(),e.key==="Escape"&&L()}function L(){d.overlay.removeEventListener("keydown",D),d.overlay.classList.replace("show","hide")}function B(e){let t=window.innerWidth-document.documentElement.clientWidth;document.body.style.overflow=e?"hidden":"",document.body.style.paddingRight=e?`${t}px`:"",document.getElementById("site-header").style.paddingRight=e?`${t}px`:""}var C=b("site-interaction"),y=document.documentElement.classList,T={};function K(e){C.log("init()"),T=e,w.init(),$.init(),v(".entry-meta-controls .track-share-control","click",ve)}function W(e){T=e,w.setCurrent(),$.setCurrent()}function ve(e){let t=e.target.getAttribute("data-artist-track-title"),n=e.target.getAttribute("data-track-url");H.show({string:t,filterString:!0,url:n})}function G(e,t,n){let i=Object.values(e).find(o=>o.id===t);return i!==void 0?i:n}function J(e,t){let n=Object.values(e).findIndex(o=>o.id===t.id),i=Object.keys(e);return n+1<i.length?e[i[n+1]]:e[i[0]]}var w=(()=>{let e={},t={toggle:null},n={toggleId:"#footer-site-theme-toggle",prefDarkScheme:"(prefers-color-scheme: dark)"},i={light:{id:"light",text:"light",class:"site-theme-light"},dark:{id:"dark",text:"dark",class:"site-theme-dark"},auto:{id:"auto",text:"auto"}};return{init:o,setCurrent:s,toggle:c};function o(){t.toggle=document.querySelector(n.toggleId),window.matchMedia(n.prefDarkScheme).addEventListener("change",l),v(n.toggleId,"click",c),s()}function s(){e=G(i,T.user.theme,i.auto),g()}function l(){e.id===i.auto.id&&g()}function c(r){r.preventDefault(),e=J(i,e),T.user.theme=e.id,g()}function g(){let r=e;e.id===i.auto.id&&(r=window.matchMedia(n.prefDarkScheme).matches?i.dark:i.light),U(f.UF_SITE_THEME,r.id),u(r)}function u(r){y.contains(r.class)===!1&&(C.log(`updateDOM() - newSiteTheme: ${r.id}`),y.remove(i.light.class,i.dark.class),y.add(r.class)),t.toggle.querySelector("span").textContent=e.text}})(),$=(()=>{let e={},t={toggle:null},n={toggleId:"#footer-track-layout-toggle",minWidth:`(max-width: ${be("--site-track-layout-min-width")})`},i={list:{id:"list",text:"list",class:"track-layout-list"},twoColumn:{id:"2-column",text:"2 column",class:"track-layout-2-column"},threeColumn:{id:"3-column",text:"3 / 4 column",class:"track-layout-3-column"}};return{init:o,setCurrent:s,toggle:c};function o(){t.toggle=document.querySelector(n.toggleId),window.matchMedia(n.minWidth).addEventListener("change",l),v(n.toggleId,"click",c),s()}function s(){e=G(i,T.user.trackLayout,i.threeColumn),t.toggle.querySelector("span").textContent=e.text,g()}function l(r){y.contains("user-layout")&&(r.matches?y.remove(e.class):y.add(e.class))}function c(r){r.preventDefault(),e=J(i,e),T.user.trackLayout=e.id,g(),r.type==="click"&&t.toggle.scrollIntoView()}function g(){U(f.UF_TRACK_LAYOUT,e.id),u()}function u(){y.contains("user-layout")&&y.contains(e.class)===!1&&(C.log(`updateDOM() - newTrackLayout: ${e.id}`),y.remove(i.list.class,i.twoColumn.class,i.threeColumn.class),window.matchMedia(n.minWidth).matches===!1&&y.add(e.class)),t.toggle.querySelector("span").textContent=e.text}})(),H=(()=>{let e=/\s{1,}[–·-]\s{1,}/i,t,n,i,o,s;return{show:l};function l(u){({title:t="Share / Play Track",string:n=null,filterString:i=!1,url:o=null,verb:s="Play"}=u),Y(t,c(s),g)}function c(u){return[{id:"copyToClipboardId",description:"<b>Copy Link</b> to Clipboard"},{id:"shareOnEmailId",description:"<b>Share</b> on Email"},{id:"amazonMusicId",description:`<b>${u}</b> on Amazon Music`},{id:"appleMusicId",description:`<b>${u}</b> on Apple Music`},{id:"spotifyId",description:`<b>${u}</b> on Spotify`},{id:"tidalId",description:`<b>${u}</b> on Tidal`},{id:"youTubeMusicId",description:`<b>${u}</b> on YouTube Music`}]}function g(u){C.log(`singleChoiceListClick(): ${u} - title: "${t}" - string: "${n}" - filterString: ${i} - url: ${o} - verb: ${s}`);let r=i?encodeURIComponent(n.replace(e," ")):encodeURIComponent(n);switch(u){case"copyToClipboardId":navigator.clipboard.writeText(o).then(()=>{N("Track link copied to clipboard",3)},m=>{C.error(`shareModal.copyToClipboard() failed because ${m}`),N("Unable to copy Track link to clipboard",5)});break;case"shareOnEmailId":window.location.href=`mailto:?subject=${encodeURIComponent(n)}&body=${o}%0d%0a`;break;case"amazonMusicId":window.open(`https://music.amazon.com/search/${r}`,"_blank");break;case"appleMusicId":window.open(`https://music.apple.com/ca/search?term=${r}`,"_blank");break;case"spotifyId":window.open(`https://open.spotify.com/search/${r}`,"_blank");break;case"tidalId":window.open(`https://google.com/search?q=${r}%20site:tidal.com`,"_blank");break;case"youTubeMusicId":window.open(`https://music.youtube.com/search?q=${r}`,"_blank");break}}})();var _=b("term-rest"),h={};function V(e,t,n,i){t in h?i(h[t].posts):(_.log(`fetchTermPosts() - termType: ${e} - termId: ${t} - maxItems: ${n}`),fetch(`/wp-json/wp/v2/posts?${e}=${t}&per_page=${n}&_fields=title,link,content,tags,categories`).then(o=>o.ok?o.json():(_.error(o),null)).then(o=>{h[t]={posts:o},i(o)}))}function Q(e,t,n,i){if("categories"in h[t]&&"tags"in h[t])i("categories",h[t].categories),i("tags",h[t].tags);else{let o=[],s=[];e.forEach(l=>{o.push.apply(o,l.categories),s.push.apply(s,l.tags)}),s=s.filter(l=>l!==t),z("categories",t,[...new Set(o)],n,i),z("tags",t,[...new Set(s)],n,i)}}function z(e,t,n,i,o){n.length>0?(_.log(`fetchMetadata() - termType: ${e} - termIds: ${n.length>0?n:"Empty"} - maxItems: ${i}`),fetch(`/wp-json/wp/v2/${e}?include=${n.join(",")}&per_page=${i}&_fields=link,name`).then(s=>s.ok?s.json():(_.error(s),null)).then(s=>{h[t][e]=s,o(e,s)})):(h[t][e]=null,o(e,null))}function X(){h=JSON.parse(sessionStorage.getItem(f.UF_TERMLIST_CACHE)),h===null&&(h={})}function Z(){sessionStorage.setItem(f.UF_TERMLIST_CACHE,JSON.stringify(h))}function ee(){sessionStorage.removeItem(f.UF_TERMLIST_CACHE)}function te(){return Object.keys(h).length>0}var Te=b("termlist"),ke=/\s{1,}[–·-]\s{1,}|\s{1,}(&#8211;)\s{1,}/i,Ce=/(?<=src=").*?(?=[?"])/i;function ie(){Te.log("init()"),document.getElementById("termlist-container").addEventListener("click",e=>{let t=e.target.closest("div.play-button");if(t!==null)return P(e,t.querySelector("a").href);let n=e.target.closest("div.shuffle-button");if(n!==null)return P(e,n.querySelector("a").href);let i=e.target.closest("div.share-find-button");if(i!==null)return we(i);if(e.target.closest("div.termlist-header")!==null)return $e(e);let s=e.target.closest("div.thumbnail");if(s!==null)return P(e,s.getAttribute("data-track-url"));if(e.target.closest("a")!==null)return ne()}),Le()}function ne(){if(te()){let e={pageUrl:window.location.href,scrollPos:Math.round(window.pageYOffset),openTermIds:[]};document.querySelectorAll(".termlist-entry").forEach(t=>{t.classList.contains("open")&&e.openTermIds.push(t.id)}),sessionStorage.setItem(f.UF_TERMLIST_STATE,JSON.stringify(e)),Z()}}function Le(){if(X(),performance.navigation.type!==performance.navigation.TYPE_RELOAD){let e=JSON.parse(sessionStorage.getItem(f.UF_TERMLIST_STATE));e!==null&&e.pageUrl===window.location.href?(history.scrollRestoration="manual",e.openTermIds.forEach(t=>document.getElementById(t).querySelector("div.termlist-header").click()),window.scroll({top:e.scrollPos,left:0,behavior:"auto"})):history.scrollRestoration="auto"}sessionStorage.removeItem(f.UF_TERMLIST_STATE),ee()}function P(e,t){e.preventDefault(),ne(),sessionStorage.setItem(f.UF_AUTOPLAY,"true"),window.location.href=t}function we(e){let t=e.getAttribute("data-term-type"),n=e.getAttribute("data-term-name"),i=e.getAttribute("data-term-url");H.show({title:`Share / Find ${t}`,string:n,url:i,verb:"Find"})}function $e(e){let t=e.target.closest("div.termlist-entry"),n=t.querySelector("div.expand-toggle span"),i=t.querySelector("div.termlist-body"),o=i.style.display.length!==0;I(t,o?"open":"closed",o?"closed":"open"),n.innerText=o?"expand_more":"expand_less",i.style.display=o?"":"flex",o||_e(t,i)}function _e(e,t){let n=document.getElementById("termlist-container").getAttribute("data-term-type"),i=parseInt(e.getAttribute("data-term-id")),o=n==="categories";V(n,i,o?10:50,s=>{let l=o?"Latest Tracks":"All Tracks",c=t.querySelector(".body-left");s!==null?Ie(l,s,c):c.innerHTML="<b>Error!</b><br>Unable to fetch track data...",!o&&s!==null&&Q(s,i,50,(g,u)=>{l=g==="tags"?"Related Artists":"In Channels",c=g==="tags"?t.querySelector(".artists"):t.querySelector(".channels"),u!==null?Me(l,u,c):c.innerHTML=`<b>${l}</b><br>None found`})})}function xe(e){return e.includes('id="soundcloud-uid')?"/wp-content/themes/ultrafunk/inc/img/soundcloud_icon.png":Ee(e.match(Ce))}function Ie(e,t,n){let i={},o=`<b>${e}</b>`;t.forEach(s=>{Se(s.title.rendered,i,ke),o+=`
    <div class="track">
      <div class="thumbnail" data-track-url="${s.link}" title="Play Track">
        <img src="${xe(s.content.rendered)}">
        <div class="thumbnail-overlay"><span class="material-icons">play_arrow</span></div>
      </div>
      <div class="artist-title text-nowrap-ellipsis">
        <a href="${s.link}" title="Go to track"><span><b>${i.artist}</b></span><br><span>${i.title}</span></a>
      </div>
    </div>`}),n.innerHTML=o}function Me(e,t,n){let i=`<b>${e}</b><br>`;t.forEach(o=>i+=`<a href="${o.link}">${o.name}</a>, `),n.innerHTML=i.slice(0,i.length-2)}var M=b("index"),S={},se={smoothScrolling:!1,settingsUpdatedEvent:"settingsUpdated",fullscreenTrackEvent:"fullscreenTrack"},a={siteHeader:null,introBanner:null,siteContent:null,siteContentSearch:null,fullscreenTarget:null};document.addEventListener("DOMContentLoaded",()=>{M.log("DOMContentLoaded"),ae(),He(),a.introBanner!==null&&Pe(),document.getElementById("termlist-container")!==null&&ie(),a.siteContentSearch!==null&&(a.siteContentSearch.focus(),a.siteContentSearch.setSelectionRange(9999,9999)),Re()});document.addEventListener(se.settingsUpdatedEvent,()=>{ae(),W(S),j(f.UF_TRACKS_PER_PAGE,S.user.tracksPerPage,60*60*24*365*5)});document.addEventListener(se.fullscreenTrackEvent,e=>a.fullscreenTarget=e.fullscreenTarget);function ae(){M.log("readSettings()"),S=Ae(f.UF_SITE_SETTINGS,Ue,!0),M.log(S)}function He(){M.log("initIndex()"),a.siteHeader=document.getElementById("site-header"),a.introBanner=document.getElementById("intro-banner"),a.siteContent=document.getElementById("site-content"),a.siteContentSearch=document.querySelector("#site-content form input.search-field"),K(S),x.init(),E.init(),k.addEventListener(),Oe.addEventListener()}document.addEventListener("keydown",e=>{if(e.ctrlKey===!1&&e.altKey===!1)switch(e.key){case"Escape":E.isVisible()&&(e.preventDefault(),E.toggle());return}if(S.user.keyboardShortcuts&&e.ctrlKey===!1&&e.altKey===!1)switch(e.key){case"c":case"C":A()&&(e.preventDefault(),E.toggle());break;case"L":A()&&le()&&($.toggle(e),k.trigger());break;case"s":case"S":A()&&Fe()&&(e.preventDefault(),x.toggle());break;case"T":A()&&le()&&w.toggle(e);break;case"ArrowLeft":e.shiftKey&&O()&&ce(navigationVars.prevUrl);break;case"ArrowRight":e.shiftKey&&O()&&ce(navigationVars.nextUrl);break}});function A(){return x.isVisible()===!1&&a.siteContentSearch!==document.activeElement}function le(){return document.body.classList.contains("page-settings")===!1}function Fe(){return a.fullscreenTarget===null}function O(){return document.body.classList.contains("no-playback")}function ce(e){e!==null&&(window.location.href=e)}function Pe(){F("localStorage")&&typeof bannerProperty!="undefined"&&bannerProperty!==null&&S.priv.banners[bannerProperty]&&(a.introBanner.style.display="block",k.trigger(),v("#intro-banner .intro-banner-close-button","click",()=>{a.introBanner.style.display="",a.siteContent.style.marginTop="",S.priv.banners[bannerProperty]=!1}))}function Re(){if(document.querySelector(".nav-bar-title .go-back-to")!==null){let e="";if(document.referrer.length===0)e="Previous Page";else{let t=new URL(decodeURIComponent(document.referrer));if(t.search.length!==0)e="Search Results";else if(t.pathname.length>1){let n=t.pathname.slice(-1)==="/"?1:0,i=t.pathname.slice(1,t.pathname.length-n).replace(/-/gi," ").split("/");i.forEach((o,s)=>e+=s+1<i.length?o+" / ":o)}}document.querySelectorAll("#site-navigation .nav-bar-title").forEach(t=>{t.querySelector(".go-back-title").textContent=e.length>0?e:"Ultrafunk (home)",t.querySelector(".go-back-to").style.opacity=1})}}var E=(()=>{let e=new ResizeObserver(s),t={navMenu:null,modalOverlay:null},n=!1;return{isVisible(){return n},scrolledTop(){t.navMenu.style.display=""},init:i,toggle:o};function i(){t.navMenu=document.querySelector("#site-navigation .nav-menu-outer"),t.modalOverlay=document.getElementById("nav-menu-modal-overlay"),v(".nav-menu-toggle","click",o),t.modalOverlay.addEventListener("click",o),t.modalOverlay.addEventListener("transitionend",l),e.observe(t.navMenu.querySelector(".menu-primary-menu-container"))}function o(){a.siteHeader.classList.contains("sticky-nav-up")?n?t.navMenu.style.display="none":t.navMenu.style.display="flex":a.siteHeader.classList.contains("sticky-nav-down")===!1&&a.siteHeader.classList.toggle("hide-nav-menu")}function s(c){n=c[0].contentRect.height!==0,n?(t.modalOverlay.className="",t.modalOverlay.classList.add("show"),setTimeout(()=>t.modalOverlay.classList.add("fadein"),50)):t.modalOverlay.classList.add("fadeout")}function l(){n===!1&&(t.modalOverlay.className="",t.navMenu.style.display="")}})(),x=(()=>{let e=new Event("allowKeyboardShortcuts"),t=new Event("denyKeyboardShortcuts"),n={searchContainer:null,searchField:null,brandingContainer:null},i=!1;return{isVisible(){return i},init:o,toggle:s,hide:l};function o(){n.searchContainer=document.getElementById("search-container"),n.searchField=n.searchContainer.querySelector(".search-field"),n.brandingContainer=a.siteHeader.querySelector("div.site-branding-container"),v(".nav-search-toggle","click",s),v(".nav-search-toggle","mousedown",r=>r.preventDefault()),n.searchField.addEventListener("blur",l),n.searchField.addEventListener("keydown",r=>{r.key==="Escape"&&(r.stopPropagation(),l())})}function s(){if(n.searchContainer.style.display.length===0){if(a.siteHeader.offsetHeight===0||re(oe.SITE_MAX_WIDTH_MOBILE)&&a.siteHeader.querySelector(".nav-bar-container-mobile-top").offsetHeight===0&&a.siteHeader.querySelector(".nav-bar-container-mobile-up").offsetHeight===0)return;c()}else l()}function l(){i&&g(!1,e,"","search")}function c(){u(),g(!0,t,"flex","clear"),n.searchField.focus(),n.searchField.setSelectionRange(9999,9999)}function g(r,m,de,ue){i=r,document.dispatchEvent(m),n.searchContainer.style.display=de,document.querySelectorAll("div.nav-search-toggle i").forEach(ge=>ge.textContent=ue),i?document.getElementById("playback-controls").classList.add("hide"):document.getElementById("playback-controls").classList.remove("hide")}function u(){let r=DOMRect;if(re(oe.SITE_MAX_WIDTH_MOBILE))n.brandingContainer.offsetHeight!==0?r.top=n.brandingContainer.offsetTop:r.top=a.siteHeader.querySelector(".nav-bar-container-mobile-up").offsetTop,r.top+=3,r.left=63,r.right=document.body.clientWidth-63,r.height=30;else if(n.brandingContainer.offsetHeight!==0){let m=n.brandingContainer.getBoundingClientRect();r.top=m.top+10,r.left=m.left,r.right=m.right,r.height=m.height-20}else{let m=a.siteHeader.querySelector(".nav-bar-container").getBoundingClientRect();r.top=m.top+2,r.left=m.left+105,r.right=m.right-105,r.height=m.height-4}n.searchContainer.style.top=`${r.top}px`,n.searchContainer.style.left=`${r.left}px`,n.searchContainer.style.width=`${r.right-r.left}px`,n.searchContainer.style.height=`${r.height}px`}})(),k=(()=>{let e=0;return{getHeaderHeight(){return e},addEventListener:t,trigger:n};function t(){n(),window.addEventListener("resize",n)}function n(){O()?e=R("--site-header-height-no-playback"):e=R("--site-header-height"),a.introBanner!==null&&a.introBanner.style.display.length!==0&&(a.introBanner.style.marginTop=`${e}px`,a.siteContent.style.marginTop=`${R("--site-content-margin-top")}px`)}})(),Oe=(()=>{let e=0,t=!1;return{addEventListener:n};function n(){i(),window.addEventListener("scroll",i)}function i(){let c=window.pageYOffset,g=Math.round(k.getHeaderHeight()>150?k.getHeaderHeight()/2:k.getHeaderHeight()/3);c<1?o():c>g&&c>e?s():l(),x.hide(),e=c}function o(){a.siteHeader.classList.remove("sticky-nav-down","sticky-nav-up"),a.siteHeader.classList.add("hide-nav-menu"),E.scrolledTop()}function s(){t===!1&&(t=!0,I(a.siteHeader,"sticky-nav-up","sticky-nav-down"))}function l(){t===!0&&(t=!1,I(a.siteHeader,"sticky-nav-down","sticky-nav-up")),E.isVisible()&&E.toggle()}})();
//# sourceMappingURL=index.js.map
