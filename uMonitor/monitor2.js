/**
  TODO: Function that parses each student submission to calculate solved status
        (for each problem, if solved/late/not solved/not submitted/number of
        subs);
  TODO: Function that receives a uname, and returns a table of number of
        problems solved per week (with late in parenthesis);
  TODO: Onload function that read basic data from problems (name, link, etc);
  TODO: Use information about to build usable monitor2
**/

// 0-- sub id, 1-- prob id, 2-- veredict, 3-- runtime,
// 4-- submission timestamp, 5-- language, 6-- rank
var student_subs = {};
var student_maxsub = {};
var student_uname = {};

var student_calls = 0;
var submissions_read = 0;
var submissions_error = 0;

function startup() {
  if (typeof(Storage) !== "undefined") {
    if (localStorage.hasOwnProperty("student_maxsub")) {
      student_maxsub = JSON.parse(localStorage.student_maxsub);
    }
    if (localStorage.hasOwnProperty("student_subs")) {
      student_subs = JSON.parse(localStorage.student_subs);
    }
    if (localStorage.hasOwnProperty("student_uname")) {
      student_uname = JSON.parse(localStorage.student_uname);
    }

  } else {
    console.log("No local storage found!")
  }
}


function clickme() {
  student_calls = 0;
  submissions_read = 0;
  submissions_error = 0;

  for (var i = 0; i < student_list.length; i++) {
    if (!(student_maxsub.hasOwnProperty(student_list[i]))) {
      student_maxsub[student_list[i]] = 0;
    }
    if (!(student_subs.hasOwnProperty(student_list[i]))) {
      student_subs[student_list[i]] = [];
    }
    load_student(student_list[i], student_maxsub[student_list[i]]);
  }
}

function process_submission_data() {
  console.log("All done! Students Read: "+student_calls+" Subs read: "+submissions_read+" Errors: "+submissions_error);

  if (typeof(Storage) !== "undefined") {
    localStorage.student_subs = JSON.stringify(student_subs);
    localStorage.student_maxsub = JSON.stringify(student_maxsub);
    localStorage.student_uname = JSON.stringify(student_uname);
  }
}



/**
  Load student submission data from uHunt API;
**/
function load_student(student_id, last_sub) {

  var api_url = "https://uhunt.onlinejudge.org/api/subs-user/"+student_id+"/"+last_sub

  var xhr = window.XMLHttpRequest ?
	new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
  xhr.onload = function() {
    if (xhr.readyState == 4) {
      if (xhr.status == 200) {
        var data = JSON.parse(xhr.responseText);
        student_subs[student_id] = student_subs[student_id].concat(data.subs);
        student_uname[student_id] = data.uname;
        student_calls += 1;
        submissions_read += data.subs.length;

        var max_sub = last_sub;
        for (var i = 0; i < data.subs.length; i++) {
          if (data.subs[i][0] > max_sub) {
            max_sub = data.subs[i][0];
          }
        }
        student_maxsub[student_id] = max_sub;
      } else {
        console.error(xhr.statusText);
        student_calls += 1;
        submissions_error += 1;
      }
      if (student_calls == student_list.length) {
        process_submission_data();
      }
    }
  }
  xhr.open("GET", api_url, true);
  xhr.onerror = function (e) { console.error(xhr.statusText); };
  xhr.send();
}
