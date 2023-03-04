var kofi_button = "<div class='text-center'><a href='https://ko-fi.com/W7W51MP72' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi1.png?v=3' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a></div>";
var reference_system = {
  name: "Eta Cassiopeiae",
  body: "Angus Manwaring starport",
  coords: { x: -16.25, y: -1.625, z: -10.5625 },
  infos: "The reference system for the Community Goal.",
  cat: [4],
};
var json_data = [];
var categories = {
  Theme: {
    1: {
      name: "Incomplete",
      color: "FF0000",
    },
    2: {
      name: "In Progress",
      color: "FFA500",
    },
    3: {
      name: "Complete",
      color: "00FF00",
    },
    4: {
      name: "Reference system",
      color: "8888FF",
    },
  },
};
// Load the json data from nh3.json
$.getJSON("js/nh3.json", function (data) {
  json_data = data;
}).promise().then(function () {
  $(json_data).each(function (index, system) {
    // create an unordered list of targets for each system as a string
    var targets = "";
    // Default to complete.
    var target_count = 0;
    var target_scanned = 0;
    $(system.targets).each(function (target_index, target) {
      checked = "";
      target_count++;
      if (getTargetState(system.name, system.body, target)) {
        target_scanned++;
        checked = "checked";
      }
      targets += "<li>";
      // Add a checkbox showing the status of the target
      targets += "<input type='checkbox' ";
      targets += "data-system-index='" + index + "' ";
      targets += "data-system='" + system.name + "' ";
      targets += "data-body='" + system.body + "' ";
      targets += "data-target='" + target + "' ";
      // targets += "id='" + target + "' ";
      targets += "onclick='toggleTarget(this)' ";
      targets += checked + "/>";
      // Add a label for each target
      targets += "<label for='" + target + "'>" + target + "</label>";
      targets += "</li>";
    });
    // Append the list of targets to the system infos
    if (system.name != "Sol") {
      json_data[index].infos = "<h3>Body: " + system.body + "</h3>";
      json_data[index].infos += "<ul class='targets'>" + targets + "</ul>";
      json_data[index].infos += kofi_button;
    }
  })
  .promise()
  .then(function () {
    $(json_data).each(function (index, system) {
      json_data[index].cat = checkSystemCategory(system.name);
    })
    .promise()
    .then(function () {

      credits = [
        {
          name: "Galnet News",
          url: "https://community.elitedangerous.com/galnet/uid/64007617ff30130adf4d10a9",
        },
        {
          name: "ED3D Galaxy Map",
          url: "https://github.com/gbiobob/ED3D-Galaxy-Map",
        },
        {
          name: "EDSM",
          url: "https://www.edsm.net/",
        },
        {
          name: "Inara",
          url: "https://inara.cz/",
        },
      ];

      json_data.push(reference_system);

      about = "This was created for my personal use, but I thought I'd share " +
        "it with the community. It is intended as an initial start for " +
        "scanning ammonia worlds. It is not a complete list.";
      // Finally init the map.
      Ed3d.init({
        container: "edmap",
        json: {
          systems: json_data,
          categories: categories,
        },
        withHudPanel: true,
        credits: credits,
        about: about,
        kofi: kofi_button,
        effectScaleSystem: [128, 1500],
        systemColor: "#00FF00",
        showNameNear: false,
        showNameFar: true,
        playerPos: [reference_system.coords.x, reference_system.coords.y, reference_system.coords.z],
      });
    })
    .promise()
    .then(function () {
      $('#hud').append("Testing");
    });
  });
});

// Get the state of a Target in local storage.
function getTargetState(system, body, target) {
  var key = system + " " + body + " " + target;
  var value = localStorage.getItem(key);
  if (value == null) {
    return 0;
  } else {
    return 1;
  }
}

// Toggle the state of the Target in local storage.
function toggleTarget(target) {
  var system = $(target).data("system");
  var body = $(target).data("body");
  var thisTarget = $(target).data("target");
  var key = system + " " + body + " " + thisTarget;
  var value = localStorage.getItem(key);
  if (value == null) {
    localStorage.setItem(key, "1");
  } else {
    localStorage.removeItem(key);
  }
  setSystemStatus(system, body);
  updateSystemOnMap(system, body);
}

// Set the status of a system based on the status of its Targets.
function setSystemStatus(name, body) {
  $(json_data).each(function (index, system) {
    if (system.name == name && system.body == body) {
      json_data[index].cat = checkSystemCategory(system.name);
    }
  });
}

// Update the state of the system on the map.
function updateSystemOnMap(system, body) {
  var newColor = new THREE.Color(0x8888ff);
  var thisSystem = getSystem(system, body);

  var idSys = getParticleId(thisSystem);
  var indexParticle = System.particleInfos[idSys];

  switch (thisSystem.cat[0]) {
    case 1:
      newColor = new THREE.Color(0xff0000);
      break;
    case 2:
      newColor = new THREE.Color(0xffa500);
      break;
    case 3:
      newColor = new THREE.Color(0x00ff00);
      break;
  }
  System.particleColor[indexParticle] = newColor;
  System.particleGeo.colorsNeedUpdate = true;
}

// Fetch a single system from json_data.
function getSystem(name, body) {
  ret = null
  $(json_data).each(function (index, system) {
    if (system.name == name && system.body == body) {
      ret = system;
    }
  });
  return ret;
}

/**
 * We need to check the state of each biological in all entries for a system.
 *
 * @param {string} system_name 
 * @returns array
 */
function checkSystemCategory(system_name) {
  // The category of the system.
  var cat = [];
  // Get all systems in json_data that have this system name.
  var systems = json_data.filter(function (system) {
    return system.name == system_name;
  });
  // Check the state of each biological in each system.
  var targets_count = 0;
  var targets_scanned = 0;
  $(systems).each(function (index, system) {
    $(system.targets).each(function (target_index, target) {
      targets_count++;
      if (getTargetState(system.name, system.body, target)) {
        targets_scanned++;
      }
    });
  });
  // Set the category of the system.
  if (system_name == reference_system) {
    cat = [4];
  } else if (targets_scanned == targets_count) {
    cat = [3];
  } else if (targets_scanned > 0) {
    cat = [2];
  } else {
    cat = [1];
  }
  return cat;
}

// Get the particle on the map from the system.
function getParticleId(system) {
  var x = parseInt(system.coords.x);
  var y = parseInt(system.coords.y);
  var z = -parseInt(system.coords.z); //-- Revert Z coord
  return x + '_' + y + '_' + z;
}