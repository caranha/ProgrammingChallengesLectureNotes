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
var student_status = {};

var student_calls = 0;
var submissions_read = 0;
var submissions_error = 0;

var variables = ["student_maxsub", "student_subs", "student_uname", "student_status"];

function startup() {

  // loading from local storage
  if (typeof(Storage) !== "undefined") {
    for (var i = 0; i < variables.length; i++)
    if (localStorage.hasOwnProperty(variables[i])) {
      window[variables[i]] = JSON.parse(localStorage[variables[i]]);
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

function grade_students() {
  for (var i = 0; i < student_list.length; i++) {
    parse_student(student_list[i]);
  }
  console.log("Finished parsing all students");
  for (var i = 1; i < student_list.length; i++) {

    addRowGradeSummary(student_list[i]);
    addRowDetailedSub(student_list[i]);
  }
}

function addRowGradeSummary(sid)
{
  tabBody=document.getElementById("grade_table");
  row=document.createElement("tr");

  sname = document.createElement("td");
  textnode = document.createTextNode(student_uname[sid]);
  sname.appendChild(textnode);
  row.appendChild(sname);

  min_week = 8;
  total_accept = 0;
  total_lates = 0;

  for (var i = 1; i < 11; i++) {
    probcell = document.createElement("td");
    prob = problemlist[i];
    weekacc = 0;
    weeklate = 0;
    totalsubs = 0;

    for (var j = 0; j < prob.mlist.length; j++) {
      if (student_status[sid][prob.mlist[j]]) {
        totalsubs += student_status[sid][prob.mlist[j]].total_subs;
        if (student_status[sid][prob.mlist[j]].status > 1) weekacc += 1;
        if (student_status[sid][prob.mlist[j]].status == 2) weeklate += 1;
      }
    }

    total_accept += weekacc;
    total_lates += weeklate;
    min_week = Math.min(min_week,weekacc);

    if (weekacc < 2) probcell.style.backgroundColor = "yellow";

    textnode = document.createTextNode("A:"+weekacc+" L:"+weeklate+" T:"+totalsubs);
    probcell.appendChild(textnode);
    row.appendChild(probcell);
  }

  finalcell = document.createElement("td");
  textnode = document.createTextNode("B:"+min_week+" T:"+total_accept+" L:"+(total_lates/total_accept).toFixed(3));
  finalcell.appendChild(textnode);
  row.appendChild(finalcell);
  tabBody.appendChild(row);
}

function addRowDetailedSub(sid)
{
   tabBody=document.getElementById("submission_table");
   row=document.createElement("tr");

   sname = document.createElement("td");
   textnode = document.createTextNode(student_uname[sid]);
   sname.appendChild(textnode);
   row.appendChild(sname);

   stsub = document.createElement("td");
   textnode = document.createTextNode(student_status[sid].total_subs);
   stsub.appendChild(textnode);
   row.appendChild(stsub);

   for (var i = 1; i < 11; i++) {
     probcell = document.createElement("td");
     prob = problemlist[i];
     pstatus = [];
     psubs = [];

     for (var j = 0; j < prob.mlist.length; j++) {
       if (student_status[sid][prob.mlist[j]]) {
         pstatus.push(student_status[sid][prob.mlist[j]].status);
         psubs.push(student_status[sid][prob.mlist[j]].total_subs);
       } else {
         pstatus.push(0);
         psubs.push(0);
       }
     }

     textnode1 = document.createTextNode("("+pstatus.join(" / ")+")");
     textnode2 = document.createTextNode("("+psubs.join(" / ")+")");
     probcell.appendChild(textnode1);
     probcell.appendChild(textnode2);
     row.appendChild(probcell);
   }

   tabBody.appendChild(row);
}


function process_submission_data() {
  console.log("All done! Students Read: "+student_calls+" Subs read: "+submissions_read+" Errors: "+submissions_error);

  if (typeof(Storage) !== "undefined") {
    for (var i = 0; i < variables.length; i++)
      localStorage[variables[i]] = JSON.stringify(window[variables[i]]);
  }
}

/**
  Receives a submission and returns: Invalid (outside DL), Not Solved, Late, Solved
  // 0-- sub id, 1-- prob id, 2-- veredict, 3-- runtime,
  // 4-- submission timestamp, 5-- language, 6-- rank
 **/
function parse_submission(sub) {
  var prob = sub[1]; var time = sub[4]*1000; var result = sub[2];

  if (time < startdate || time > enddate) return 0; // outside valid date
  var dl = getProbDL(prob);
  if (dl == -1) return 0; // not a valid problem
  if (result < 80) return 1; // failed submission
  if (time > dl) return 2;
  else return 3;
}

/**

**/
function parse_student(student_id) {
  if (!(student_status.hasOwnProperty(student_id))) {
    student_status[student_id] = {};
    student_status[student_id].total_subs = 0;
  }

  for (var i = 0; i < student_subs[student_id].length; i++) {
    var sub = student_subs[student_id][i];
    var ret = parse_submission(sub);
    if (ret > 0) {
      student_status[student_id].total_subs += 1;
      if (!(student_status[student_id].hasOwnProperty(sub[1]))) {
        student_status[student_id][sub[1]] = {};
        student_status[student_id][sub[1]].total_subs = 0;
        student_status[student_id][sub[1]].status = 0;
      }
      student_status[student_id][sub[1]].total_subs += 1;
      student_status[student_id][sub[1]].status = Math.max(ret,student_status[student_id][sub[1]].status);
    }
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
