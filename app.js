const Beam = require('beam-client-node');
const Interactive = require('beam-interactive-node');
const rjs = require('robotjs');
const fs = require('fs');
const fetch = require('node-fetch');
const Packets = require('beam-interactive-node/dist/robot/packets').default;

var channelId;
var obj = JSON.parse(fs.readFileSync('pw.json', 'utf8'));
const username = obj.un;
const password = obj.pw;

const beam = new Beam();
var holds = {};
fetch("https://beam.pro/api/v1/channels/" + username).then(function(res) {
  return res.json();
}).then(function(json) {
        channelId = json.id;
        console.log(channelId);
        beam.use('password', {
            username,
            password,
        })
        .attempt()
        .then(() => beam.game.join(channelId))
        .then(res => createRobot(res))
        .then(robot => performRobotHandShake(robot))
        .then(robot => setupRobotEvents(robot))
        .catch(err => {
            if (err.res) {
                throw new Error('Error connecting to Interactive:' + err.res.body.mesage);
            }
            throw new Error('Error connecting to Interactive', err);
        });

        function createRobot (res) {
            return new Interactive.Robot({
                remote: res.body.address,
                channel: channelId,
                key: res.body.key,
            });
        }

        function performRobotHandShake (robot) {
            return new Promise((resolve, reject) => {
                robot.handshake(err => {
                    if (err) {
                        reject(err);
                    }
                    resolve(robot);
                });
            });
        }

        function setupRobotEvents (robot) {
            robot.on('report', report => {
                if (report.tactile.length > 0) {
                    check(report.tactile, robot, report.tactile.length);
                }
            });
            robot.on('error', err => {
                throw new Error('There was an error in the Interactive connection', err);
            });
        }
}).catch(function(err) {
  console.log(err);
});
var holding = [];
function check(t, robot, len) {
  t.forEach(i=>{ if(i.holding > holding[i.id]) {
     trigger(i.id, robot);
   }
   holding[i.id] = i.holding;
   //console.log(holding);
 });
}

function trigger(id, robot, len) {
  console.log("triggered: " + id);
  if (id === 0) {
    //rjs.keyTap("s", "control");
    //cdAll(len);
    let json = {tactile: [new Packets.ProgressUpdate.TactileUpdate({id: id, cooldown: 30000})]};
    let update = new Packets.ProgressUpdate(json);
    //console.log(update);
    robot.send(update);
  }
  if (id === 1) {
    //rjs.keyTap(";");
  }
}
