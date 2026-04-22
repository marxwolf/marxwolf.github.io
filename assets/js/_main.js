/* ==========================================================================
   jQuery plugin settings and other scripts
   ========================================================================== */

$(document).ready(function(){
   // Sticky footer
  var bumpIt = function() {
      $("body").css("margin-bottom", $(".page__footer").outerHeight(true));
    },
    didResize = false;

  bumpIt();

  $(window).resize(function() {
    didResize = true;
  });
  setInterval(function() {
    if (didResize) {
      didResize = false;
      bumpIt();
    }
  }, 250);
  // FitVids init
  $("#main").fitVids();

  // init sticky sidebar
  $(".sticky").Stickyfill();

  var stickySideBar = function(){
    var show = $(".author__urls-wrapper button").length === 0 ? $(window).width() > 1024 : !$(".author__urls-wrapper button").is(":visible");
    // console.log("has button: " + $(".author__urls-wrapper button").length === 0);
    // console.log("Window Width: " + windowWidth);
    // console.log("show: " + show);
    //old code was if($(window).width() > 1024)
    if (show) {
      // fix
      Stickyfill.rebuild();
      Stickyfill.init();
      $(".author__urls").show();
    } else {
      // unfix
      Stickyfill.stop();
      $(".author__urls").hide();
    }
  };

  stickySideBar();

  $(window).resize(function(){
    stickySideBar();
  });

  // Follow menu drop down

  $(".author__urls-wrapper button").on("click", function() {
    $(".author__urls").fadeToggle("fast", function() {});
    $(".author__urls-wrapper button").toggleClass("open");
  });

  // init smooth scroll
  $("a").smoothScroll({offset: -20});

  // add lightbox class to all image links
  $("a[href$='.jpg'],a[href$='.jpeg'],a[href$='.JPG'],a[href$='.png'],a[href$='.gif']").addClass("image-popup");

  // Magnific-Popup options
  $(".image-popup").magnificPopup({
    // disableOn: function() {
    //   if( $(window).width() < 500 ) {
    //     return false;
    //   }
    //   return true;
    // },
    type: 'image',
    tLoading: 'Loading image #%curr%...',
    gallery: {
      enabled: true,
      navigateByImgClick: true,
      preload: [0,1] // Will preload 0 - before current, and 1 after the current image
    },
    image: {
      tError: '<a href="%url%">Image #%curr%</a> could not be loaded.',
    },
    removalDelay: 500, // Delay in milliseconds before popup is removed
    // Class that is added to body when popup is open.
    // make it unique to apply your CSS animations just to this exact popup
    mainClass: 'mfp-zoom-in',
    callbacks: {
      beforeOpen: function() {
        // just a hack that adds mfp-anim class to markup
        this.st.image.markup = this.st.image.markup.replace('mfp-figure', 'mfp-figure mfp-with-anim');
      }
    },
    closeOnContentClick: true,
    midClick: true // allow opening popup on middle mouse click. Always set it to true if you don't provide alternative source.
  });

  var initVisitorWidget = function() {
    var widget = document.querySelector(".js-visitor-widget");
    var mapElement = document.getElementById("visitor-map");
    var countElement = document.getElementById("visitor-count");
    var locationElement = document.getElementById("visitor-location");
    var statusElement = document.getElementById("visitor-status");
    var namespace = "marxwolf-github-io";
    var totalKey = "unique-visitors";
    var ipSalt = "marxwolf-visitor-map-v1";

    if (!widget || !mapElement || !countElement || !locationElement || !statusElement) {
      return;
    }

    if (!window.L || !window.fetch || !window.crypto || !window.crypto.subtle) {
      statusElement.textContent = "Visitor map is unavailable in this browser.";
      countElement.textContent = "Unavailable";
      return;
    }

    var requestJson = function(url) {
      return fetch(url, {
        headers: {
          Accept: "application/json"
        }
      }).then(function(response) {
        return response.json().then(function(data) {
          if (!response.ok) {
            throw data;
          }
          return data;
        });
      });
    };

    var bytesToHex = function(buffer) {
      return Array.from(new Uint8Array(buffer)).map(function(byte) {
        return byte.toString(16).padStart(2, "0");
      }).join("");
    };

    var digestIp = function(ipAddress) {
      var encoded = new TextEncoder().encode(ipAddress + ":" + ipSalt);
      return window.crypto.subtle.digest("SHA-256", encoded).then(bytesToHex);
    };

    var createCounter = function(key, value) {
      var query = [
        "namespace=" + encodeURIComponent(namespace),
        "key=" + encodeURIComponent(key),
        "value=" + encodeURIComponent(String(value))
      ].join("&");

      return requestJson("https://api.countapi.xyz/create?" + query);
    };

    var getCounter = function(key) {
      return requestJson("https://api.countapi.xyz/get/" + encodeURIComponent(namespace) + "/" + encodeURIComponent(key));
    };

    var updateCounter = function(key, amount) {
      return requestJson(
        "https://api.countapi.xyz/update/" +
          encodeURIComponent(namespace) +
          "/" +
          encodeURIComponent(key) +
          "?amount=" +
          encodeURIComponent(String(amount))
      );
    };

    var ensureTotalCounter = function() {
      return createCounter(totalKey, 0).catch(function() {
        return null;
      });
    };

    var syncUniqueVisitorCount = function(ipAddress) {
      return ensureTotalCounter()
        .then(function() {
          return digestIp(ipAddress);
        })
        .then(function(ipHash) {
          var seenKey = "seen-" + ipHash;

          return createCounter(seenKey, 1)
            .then(function() {
              return updateCounter(totalKey, 1);
            })
            .catch(function() {
              return getCounter(totalKey);
            });
        })
        .then(function(result) {
          if (result && typeof result.value !== "undefined") {
            countElement.textContent = result.value;
          } else {
            countElement.textContent = "Unavailable";
          }
        })
        .catch(function() {
          countElement.textContent = "Unavailable";
        });
    };

    var renderMap = function(latitude, longitude, label) {
      var map = L.map(mapElement, {
        scrollWheelZoom: false
      }).setView([latitude, longitude], 4);

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      L.circleMarker([latitude, longitude], {
        radius: 9,
        weight: 2,
        color: "#17324d",
        fillColor: "#3e7cb1",
        fillOpacity: 0.8
      }).addTo(map).bindPopup(label).openPopup();

      window.setTimeout(function() {
        map.invalidateSize();
      }, 0);
    };

    requestJson("https://ipapi.co/json/")
      .then(function(location) {
        if (!location || typeof location.latitude !== "number" || typeof location.longitude !== "number") {
          throw new Error("Missing location");
        }

        var place = [location.city, location.region, location.country_name].filter(Boolean).join(", ");

        locationElement.textContent = place ?
          "Approximate location: " + place + "." :
          "Approximate location is available, but place details are limited.";
        statusElement.textContent = "Unique visitors are counted once per public IP hash.";

        renderMap(location.latitude, location.longitude, place || "Approximate visitor location");

        if (location.ip) {
          return syncUniqueVisitorCount(location.ip);
        }

        countElement.textContent = "Unavailable";
        return null;
      })
      .catch(function() {
        locationElement.textContent = "Unable to determine visitor location right now.";
        statusElement.textContent = "The map and unique visitor counter depend on external geolocation services.";
        countElement.textContent = "Unavailable";
      });
  };

  initVisitorWidget();

});
