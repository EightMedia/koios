!function(e,t){for(var r in t)e[r]=t[r]}(exports,function(e){var t={};function r(a){if(t[a])return t[a].exports;var n=t[a]={i:a,l:!1,exports:{}};return e[a].call(n.exports,n,n.exports,r),n.l=!0,n.exports}return r.m=e,r.c=t,r.d=function(e,t,a){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:a})},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var a=Object.create(null);if(r.r(a),Object.defineProperty(a,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var n in e)r.d(a,n,function(t){return e[t]}.bind(null,n));return a},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="",r(r.s=1)}([,function(e,t,r){function a(){return(a=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var r=arguments[t];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(e[a]=r[a])}return e}).apply(this,arguments)}t.handler=async(e,t)=>{const n=e.queryStringParameters,i=r(2),o={featured:null,items:null,showMore:!1};var s=a({page:1},n);s.amount=9;const l=!(!s.branch&&!s.category);l||(o.featured=i.filter((function(e){return e.featured})).slice(0,2));var u=i.filter(e=>{var t=!0;return!0===t&&e.featured&&(t=l),!0===t&&s.branch&&(t=[].concat(e.branches).includes(s.branch)),!0===t&&s.category&&(t=e.category===s.category),!0===t&&s.noEvents&&(t="evenement"!==e.category),t});return o.items=u.slice(0,s.page*s.amount),o.showMore=o.items.length>0&&u.length>o.items.length,0===o.items.length&&(o.items=null),{statusCode:200,body:JSON.stringify(o)}}},function(e){e.exports=JSON.parse('[{"category":"podcast","branches":["verkoop","ICT"],"startDate":"2019-12-15T12:30:00.000Z","endDate":"2019-12-15T12:30:00.000Z","teaserImage":{"url":"https://eightmedia-werkenbij-rijkswaterstaat.imgix.net/zandsuppletie.jpg"},"title":"Audiotour: Wij zijn bezig met groot onderhoud aan onze kunstwerken","teaserIntro":"Onze experts gaan tijdens dit webinar in op het thema: Circulaire infrastructuur door de ogen van Rijkswaterstaat.","linkToSelf":{"link":"podcast.html"},"multimediaIcon":"audio","featured":"true"},{"category":"project","branches":[],"teaserImage":{"url":"https://eightmedia-werkenbij-rijkswaterstaat.imgix.net/rws-zeeland.jpg"},"title":"Samen werken aan een bereikbaar Zeeland","teaserTitle":"","teaserIntro":"We renoveren en vervangt de komende jaren een flink aantal sluizen, bruggen, wegen en waterwerken in de provincie Zeeland.","intro":"","linkToSelf":{"link":"timeline.html"},"multimediaIcon":""},{"category":"evenement","branches":"techniek","startDate":"2019-12-16T09:00:00.000Z","endDate":"2019-12-16T18:00:00.000Z","teaserImage":{"url":"https://eightmedia-werkenbij-rijkswaterstaat.imgix.net/infratech.jpg"},"title":"Infratech 2019 over circulaire infrastructuur","teaserTitle":"Infratech 2019, kom je ook?","intro":"Lange versie. Onze experts gaan tijdens dit webinar in op het thema: Circulaire infrastructuur door de ogen van Rijkswaterstaat.","teaserIntro":"Onze experts gaan tijdens dit webinar in op het thema: Circulaire infrastructuur door de ogen van Rijkswaterstaat.","linkToSelf":{"link":"evenement.html"},"featured":"true"},{"category":"webinar","branches":"bedrijfsvoering","teaserImage":{"url":"https://eightmedia-werkenbij-rijkswaterstaat.imgix.net/stickies-plakken.jpg"},"teaserImageImgixParams":"fit=crop&crop=faces","title":"Webinar Circulaire infrastructuur","teaserIntro":"Onze experts gaan tijdens dit webinar in op het thema: Circulaire infrastructuur door de ogen van Rijkswaterstaat.","linkToSelf":{"link":"artikel.html"}},{"category":"vlog","branches":["verkoop","techniek"],"teaserImage":{"url":"https://eightmedia-werkenbij-rijkswaterstaat.imgix.net/drone.jpg"},"title":"Onze innovatie experts testen de nieuwste drones","teaserIntro":"Onze experts gaan tijdens dit webinar in op het thema: Circulaire infrastructuur door de ogen van Rijkswaterstaat.","linkToSelf":{"link":"artikel.html"},"multimediaIcon":"video"},{"category":"innovatie","branches":"techniek","teaserImage":{"url":"https://eightmedia-werkenbij-rijkswaterstaat.imgix.net/circulair-congres.jpg"},"title":"Hoe ziet de weg van de toekomst eruit?","teaserIntro":"Onze experts gaan tijdens dit webinar in op het thema: Circulaire infrastructuur door de ogen van Rijkswaterstaat.","linkToSelf":{"link":"artikel.html"},"multimediaIcon":"video"},{"category":"whitepaper","branches":"bedrijfsvoering","teaserImage":{"url":"https://eightmedia-werkenbij-rijkswaterstaat.imgix.net/florus_noordhoek.jpg"},"title":"De innovatie één stap voor blijven","teaserIntro":"Informatievoorziening is voor de organisatie een tamelijk nieuwe discipline, maar speelt een steeds belangrijkere rol.","linkToSelf":{"link":"artikel.html"}},{"category":"evenement","startDate":"2019-12-10T12:30:00.000Z","endDate":"2019-12-10T12:30:00.000Z","branches":"techniek","teaserImage":{"url":"https://eightmedia-werkenbij-rijkswaterstaat.imgix.net/snelweg-bij-nacht.jpg"},"title":"Nationale Cybersecurity","teaserIntro":"Nederland beschermen tegen cyberaanvallen? Op 14 februari 2019 organiseren wij een Security Battle op onze locatie in Utrecht.","linkToSelf":{"link":"evenement.html"},"featured":"true"},{"category":"podcast","branches":"verkoop","teaserImage":{"url":"https://eightmedia-werkenbij-rijkswaterstaat.imgix.net/zandmotorcongres.jpg"},"title":"Zandmotor: pilotproject voor natuurlijke kustbescherming","teaserIntro":"Rijkswaterstaat legde in 2011 de Zandmotor aan. De Zandmotor ligt ten zuiden van Den Haag tussen Ter Heijde en Kijkduin. We hebben zand opgespoten voor de kust, waardoor een schiereiland is ontstaan.","linkToSelf":{"link":"podcast.html"},"multimediaIcon":"audio"},{"category":"podcast","branches":["bedrijfsvoering","verkoop"],"teaserImage":{"url":"https://eightmedia-werkenbij-rijkswaterstaat.imgix.net/stickies-plakken.jpg"},"teaserImageImgixParams":"fit=crop&crop=faces","title":"Webinar Circulaire infrastructuur","teaserIntro":"Onze experts gaan tijdens dit webinar in op het thema: Circulaire infrastructuur door de ogen van Rijkswaterstaat.","linkToSelf":{"link":"podcast.html"}},{"category":"interview","branches":"verkoop","teaserImage":{"url":"https://eightmedia-werkenbij-rijkswaterstaat.imgix.net/vlootvervanging.jpg"},"title":"‘Rijkswaterstaat van start met grootste onderhoudsopgave ooit’","teaserIntro":"Onze experts gaan tijdens dit webinar in op het thema: Circulaire infrastructuur.","linkToSelf":{"link":"artikel.html"},"multimediaIcon":"audio"},{"category":"evenement","branches":"techniek","startDate":"2019-11-24T12:30:00.000Z","endDate":"2019-11-24T12:30:00.000Z","teaserImage":{"url":"https://eightmedia-werkenbij-rijkswaterstaat.imgix.net/infratech.jpg"},"title":"Infratech 2019, kom je ook?","teaserIntro":"Onze experts gaan tijdens dit webinar in op het thema: Circulaire infrastructuur door de ogen van Rijkswaterstaat.","linkToSelf":{"link":"evenement.html"}},{"category":"vlog","branches":"verkoop","teaserImage":{"url":"https://eightmedia-werkenbij-rijkswaterstaat.imgix.net/zandmotorcongres.jpg"},"title":"Circulaire infrastructuur en rotondes","teaserIntro":"Onze experts gaan tijdens dit webinar in op het thema: Circulaire infrastructuur door de ogen van Rijkswaterstaat.","linkToSelf":{"link":"artikel.html"},"multimediaIcon":"video"},{"category":"evenement","branches":"verkoop","startDate":"2019-10-18T12:30:00.000Z","endDate":"2019-10-20T12:30:00.000Z","teaserImage":{"url":"https://eightmedia-werkenbij-rijkswaterstaat.imgix.net/knooppunt.jpg"},"title":"Nieuw circuit aangelegd","teaserIntro":"Onze experts gaan tijdens dit webinar in op het thema: Circulaire infrastructuur door de ogen van Rijkswaterstaat.","linkToSelf":{"link":"evenement.html"}},{"category":"innovatie","branches":"techniek","teaserImage":{"url":"https://eightmedia-werkenbij-rijkswaterstaat.imgix.net/circulair-congres.jpg"},"title":"Hoe ziet de weg van de toekomst eruit?","teaserIntro":"Onze experts gaan tijdens dit webinar in op het thema: Circulaire infrastructuur door de ogen van Rijkswaterstaat.","linkToSelf":{"link":"artikel.html"},"multimediaIcon":"video"},{"category":"evenement","startDate":"2019-10-05T12:30:00.000Z","endDate":"2019-10-05T12:30:00.000Z","branches":"techniek","teaserImage":{"url":"https://eightmedia-werkenbij-rijkswaterstaat.imgix.net/snelweg-bij-nacht.jpg"},"title":"Bescherm Nederland tegen cyberaanvallen","teaserIntro":"Nederland beschermen tegen cyberaanvallen? Op 14 februari 2019 organiseren wij een Security Battle op onze locatie in Utrecht.","linkToSelf":{"link":"evenement.html"}},{"category":"interview","branches":"verkoop","teaserImage":{"url":"https://eightmedia-werkenbij-rijkswaterstaat.imgix.net/vlootvervanging.jpg"},"title":"‘Rijkswaterstaat van start met grootste onderhoudsopgave ooit’","teaserIntro":"Onze experts gaan tijdens dit webinar in op het thema: Circulaire infrastructuur.","linkToSelf":{"link":"artikel.html"},"multimediaIcon":"audio"},{"category":"vlog","branches":"verkoop","teaserImage":{"url":"https://eightmedia-werkenbij-rijkswaterstaat.imgix.net/zandmotorcongres.jpg"},"title":"Onze innovatie experts testen de nieuwste drones","teaserIntro":"Onze experts gaan tijdens dit webinar in op het thema: Circulaire infrastructuur door de ogen van Rijkswaterstaat.","linkToSelf":{"link":"artikel.html"},"multimediaIcon":"video"},{"category":"evenement","branches":"verkoop","startDate":"2019-09-30T12:30:00.000Z","endDate":"2019-10-01T12:30:00.000Z","teaserImage":{"url":"https://eightmedia-werkenbij-rijkswaterstaat.imgix.net/tunnel-velsen.jpg"},"title":"Onze innovatie experts testen de nieuwste drones","teaserIntro":"Onze experts gaan tijdens dit webinar in op het thema: Circulaire infrastructuur door de ogen van Rijkswaterstaat.","linkToSelf":{"link":"evenement.html"}},{"category":"innovatie","branches":"techniek","teaserImage":{"url":"https://eightmedia-werkenbij-rijkswaterstaat.imgix.net/circulair-congres.jpg"},"title":"Hoe ziet de weg van de toekomst eruit?","teaserIntro":"Onze experts gaan tijdens dit webinar in op het thema: Circulaire infrastructuur door de ogen van Rijkswaterstaat.","linkToSelf":{"link":"artikel.html"},"multimediaIcon":"video"},{"category":"evenement","startDate":"2019-12-09T12:30:00.000Z","endDate":"2019-12-09T12:30:00.000Z","branches":"techniek","teaserImage":{"url":"https://eightmedia-werkenbij-rijkswaterstaat.imgix.net/snelweg-bij-nacht.jpg"},"title":"Security Battle 2019","teaserIntro":"Nederland beschermen tegen cyberaanvallen? Op 14 februari 2019 organiseren wij een Security Battle op onze locatie in Utrecht.","linkToSelf":{"link":"evenement.html"}},{"category":"evenement","branches":"techniek","startDate":"2019-06-29T12:30:00.000Z","endDate":"2019-06-29T12:30:00.000Z","teaserImage":{"url":"https://eightmedia-werkenbij-rijkswaterstaat.imgix.net/infratech.jpg"},"title":"Infratech 2019, kom je ook?","teaserIntro":"Onze experts gaan tijdens dit webinar in op het thema: Circulaire infrastructuur door de ogen van Rijkswaterstaat.","linkToSelf":{"link":"evenement.html"}},{"category":"webinar","branches":"bedrijfsvoering","teaserImage":{"url":"https://eightmedia-werkenbij-rijkswaterstaat.imgix.net/stickies-plakken.jpg"},"teaserImageImgixParams":"fit=crop&crop=faces","title":"Webinar Circulaire infrastructuur","teaserIntro":"Onze experts gaan tijdens dit webinar in op het thema: Circulaire infrastructuur door de ogen van Rijkswaterstaat.","linkToSelf":{"link":"artikel.html"}},{"category":"interview","branches":"verkoop","teaserImage":{"url":"https://eightmedia-werkenbij-rijkswaterstaat.imgix.net/vlootvervanging.jpg"},"title":"‘Rijkswaterstaat van start met grootste onderhoudsopgave ooit’","teaserIntro":"Onze experts gaan tijdens dit webinar in op het thema: Circulaire infrastructuur.","linkToSelf":{"link":"artikel.html"},"multimediaIcon":"audio"},{"category":"vlog","branches":"verkoop","teaserImage":{"url":"https://eightmedia-werkenbij-rijkswaterstaat.imgix.net/zandmotorcongres.jpg"},"title":"Onze innovatie experts testen de nieuwste drones","teaserIntro":"Onze experts gaan tijdens dit webinar in op het thema: Circulaire infrastructuur door de ogen van Rijkswaterstaat.","linkToSelf":{"link":"artikel.html"},"multimediaIcon":"video"},{"category":"evenement","branches":"verkoop","startDate":"2019-06-01T12:30:00.000Z","endDate":"2019-06-02T12:30:00.000Z","teaserImage":{"url":"https://eightmedia-werkenbij-rijkswaterstaat.imgix.net/tunnel-velsen.jpg"},"title":"Onze innovatie experts testen de nieuwste drones","teaserIntro":"Onze experts gaan tijdens dit webinar in op het thema: Circulaire infrastructuur door de ogen van Rijkswaterstaat.","linkToSelf":{"link":"evenement.html"}},{"category":"innovatie","branches":"techniek","teaserImage":{"url":"https://eightmedia-werkenbij-rijkswaterstaat.imgix.net/circulair-congres.jpg"},"title":"Hoe ziet de weg van de toekomst eruit?","teaserIntro":"Onze experts gaan tijdens dit webinar in op het thema: Circulaire infrastructuur door de ogen van Rijkswaterstaat.","linkToSelf":{"link":"artikel.html"},"multimediaIcon":"video"}]')}]));