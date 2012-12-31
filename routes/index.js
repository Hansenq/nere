
/*
 * GET home page.
 */

exports.index = function(req, res){
  var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
  console.log('Client IP address: ' + ip);

  res.render('index', {
    title: 'nere',
    ipaddress: JSON.stringify(ip),
    parsedip: ip
  });
};