exports.constructJSON = trace => {
    var countMap = {};
    var fileStackMap = {};
    var classStackMap = {};
    var jukwaaServiceMap = {};
    var countData = [];
    var consolidationData = [];
    var classStackData = [];
    var jukwaaServiceData = [];
    var timestamp, command, servicename, signedin, uri, traceId;

    // Maintain our own whitelist to filter out unknown classes
    var knownDataClasses = new Set(["C2NVPDB", "C2DataAccess", "C2Search", "C2SearchV2", "C2SpaceSearch"]);
    trace.map((span) => {
        if (span.name.startsWith('\[') || span.name == 'local_cache') {
            // Do nothing
        } else if (countMap[span.name]) {
            countMap[span.name].counts += 1;
            countMap[span.name].duration += span.duration;
            if (span.duration > countMap[span.name].max) countMap[span.name].max = span.duration;
        } else {
            countMap[span.name] = {counts: 1, duration: span.duration, max: span.duration};
        }

        if (span.tags) {
            if (span.tags.FileStackTrace) {
                var fileTrace = span.tags.FileStackTrace;
                var fileMap = {};
                var dataArr = fileTrace.split(':::');

                // Hash (Class + Function) ::: CallType ::: Compact Class Stack Trace ::: File Stack Trace ::: thriftMethodName
                fileMap['hash'] = dataArr[0];
                fileMap['callType'] = dataArr[1];
                fileMap['classTrace'] = dataArr[2];
                fileMap['stackTrace'] = dataArr[3];
                fileMap['thriftMethodName'] = dataArr[4];
                if (!knownDataClasses.has(fileMap['callType'])) {
                    // Do nothing
                } else if (fileStackMap[fileMap['hash']]) {
                    fileStackMap[fileMap['hash']].counts += 1;
                    fileStackMap[fileMap['hash']].duration += span.duration;
                    fileStackMap[fileMap['hash']].stackTraces.push({time: span.duration, stackTrace: fileMap['stackTrace']});
                    if (span.duration > fileStackMap[fileMap['hash']].max) fileStackMap[fileMap['hash']].max = span.duration;
                } else {
                    fileStackMap[fileMap['hash']] = {callType: fileMap['callType'], callTrace: fileMap['classTrace'], counts: 1, duration: span.duration, max: span.duration, stackTraces: [{time: span.duration, stackTrace: fileMap['stackTrace']}], thriftMethodName: fileMap['thriftMethodName']};
                }
            }
            if (span.tags.ClassStackTrace) {
                var classTrace = span.tags.ClassStackTrace;
                var dataArr = classTrace.split(':::');
                var thriftMethodName = dataArr[1];
                var classMap = {};
                var idx = 0;
                var classArr = dataArr[0].split(' > ');
                var jukwaaServiceArr = dataArr[0].split(' > ThriftService');
                var jukwaaService;
                if (thriftMethodName !== '') {
                    if (jukwaaServiceArr.length > 0) {
                        jukwaaService = jukwaaServiceArr[0];
                    } else {
                        jukwaaServiceArr = dataArr[0].split('[bizarre].handle_shutdown');
                        if (jukwaaServiceArr.length > 0) {
                            jukwaaService = jukwaaServiceArr[0];
                        }
                    }
                    if (jukwaaService) {
                        jukwaaService = jukwaaService.split(' > ')[1] + ' > ' + thriftMethodName;
                        if (jukwaaServiceMap[jukwaaService]) {
                            jukwaaServiceMap[jukwaaService].counts += 1;
                            jukwaaServiceMap[jukwaaService].duration += span.duration;
                            if (jukwaaServiceMap[jukwaaService]['data'][span.name]) {
                                jukwaaServiceMap[jukwaaService]['data'][span.name].counts += 1;
                                jukwaaServiceMap[jukwaaService]['data'][span.name].duration += span.duration;
                                if (span.duration > jukwaaServiceMap[jukwaaService]['data'][span.name].max) jukwaaServiceMap[jukwaaService]['data'][span.name].max = span.duration;
                            } else {
                                jukwaaServiceMap[jukwaaService]['data'][span.name] = {counts: 1, duration: span.duration, max: span.duration}
                            }

                            // if (jukwaaServiceMap[jukwaaService]['data'][span.name].max > jukwaaServiceMap[jukwaaService].max) jukwaaServiceMap[jukwaaService].max = jukwaaServiceMap[jukwaaService]['data'][span.name].max;
                        } else {
                            jukwaaServiceMap[jukwaaService] = {counts: 1, duration: span.duration, data: {}};
                            // jukwaaServiceMap[jukwaaService] = {counts: 1, duration: span.duration, max: span.duration, data: {}};
                            jukwaaServiceMap[jukwaaService]['data'][span.name] = {counts: 1, duration: span.duration, max: span.duration}
                        }
                    }
                }

                for (let className of classArr) {
                    if (classMap[className] && idx - classMap[className] >= 1) {
                        if (classStackMap[classTrace]) {
                            classStackMap[classTrace].counts += 1;
                            classStackMap[classTrace].duration += span.duration;
                            if (span.duration > classStackMap[classTrace].max) classStackMap[classTrace].max = span.duration;
                        } else {
                            classStackMap[classTrace] = {counts: 1, duration: span.duration, max: span.duration};
                        }
                        break;
                    } else {
                        classMap[className] = idx;
                    }
                    idx++;
                }
            }

            if (((span.name.match(/\[jukwaa\]/) && span.traceId === span.id) || span.name.match(/\[jukwaa\]currentuserservice.getcurrentuser/) || (span.name.match(/\[c2\]/) && span.parentId == null))) {
                if(span.tags.timestamp) {
                    timestamp = span.tags.timestamp;
                }
                if(span.tags.servicename) {
                    servicename = span.tags.servicename;
                }
                if(span.tags.signedin) {
                    if (span.name.match(/\[jukwaa\]currentuserservice.getcurrentuser/)) {
                        signedin = span.tags.signedin;
                    }
                }
                if(span.tags.command) {
                    command = span.tags.command;
                }
                if(span.tags['http.url']) {
                    uri = span.tags['http.url'];
                }
                if(span.traceId) {
                    traceId = span.traceId;
                }
            }
        }
    });
    Object.keys(countMap).forEach((name) => {
        countData.push({name: name, counts: countMap[name].counts, duration: (Math.round(countMap[name].duration/100)/10), max: (Math.round(countMap[name].max/100)/10)});
    });
    Object.keys(fileStackMap).forEach((name) => {
        if (fileStackMap[name].counts > 1) {
            var data = [];
            fileStackMap[name].stackTraces.forEach(el => {
                data.push({calltype: fileStackMap[name].callType, trace: el.stackTrace, duration: (Math.round(el.time/100)/10)});
            });
            data.sort((a, b) => (a.duration > b.duration ? -1 : 1));
            consolidationData.push({hash: name, calltype: fileStackMap[name].callType, trace: fileStackMap[name].callTrace, thriftMethodName: fileStackMap[name].thriftMethodName, counts: fileStackMap[name].counts, duration: (Math.round(fileStackMap[name].duration/100)/10), max: (Math.round(fileStackMap[name].max/100)/10), fileStack: data});
        }
    });

    Object.keys(jukwaaServiceMap).forEach((service) => {
        var data = [];
        Object.keys(jukwaaServiceMap[service].data).forEach(name => {
            data.push({service: service, name: name, counts: jukwaaServiceMap[service]['data'][name].counts, duration: (Math.round(jukwaaServiceMap[service]['data'][name].duration/100)/10), max: (Math.round(jukwaaServiceMap[service]['data'][name].max/100)/10)});
        });
        data.sort((a, b) => (a.counts > b.counts ? -1 : 1));
        var sqlCounts = 0;
        var redisCounts = 0;
        data.forEach(el => {
            if (el.name.startsWith('sql_reads')) {
                sqlCounts += el.counts;
            } else if (el.name.startsWith('redis_reads') || el.name.startsWith('redis_update')) {
                redisCounts += el.counts;
            }
        });
        jukwaaServiceData.push({name: service, sqlcounts: sqlCounts, rediscounts: redisCounts, counts: jukwaaServiceMap[service].counts, duration: (Math.round(jukwaaServiceMap[service].duration/100)/10), serviceData: data});
    });

    Object.keys(classStackMap).forEach((name) => {
        classStackData.push({trace: name, counts: classStackMap[name].counts,duration: (Math.round(classStackMap[name].duration/100)/10), max: (Math.round(classStackMap[name].max/100)/10)});
    });

    countData.sort((a, b) => (a.counts > b.counts ? -1 : 1));
    consolidationData.sort((a, b) => (a.counts > b.counts ? -1 : 1));
    jukwaaServiceData.sort((a, b) => (a.duration > b.duration ? -1 : 1));
    classStackData.sort((a, b) => (a.counts > b.counts ? -1 : 1));

    return {
        perfCount:countData,
        consolidation: consolidationData,
        servicePerf: jukwaaServiceData,
        loop: classStackData,
        signedin: signedin,
        servicename: servicename,
        timestamp: timestamp,
        uri: uri,
        command: command,
        traceId: traceId
    };
};

exports.COUNT_TABLE_COLUMNS = [
    {
        id: 'name',
        numeric: false,
        disablePadding: false,
        label: 'Name'
    }, {
        id: 'counts',
        numeric: true,
        disablePadding: false,
        label: 'Counts'
    }, {
        id: 'duration',
        numeric: true,
        disablePadding: false,
        label: 'Duration (ms)'
    }, {
        id: 'max',
        numeric: true,
        disablePadding: false,
        label: 'Max Time (ms)'
    }
];

exports.CONSOLIDATION_TABLE_COLUMNS = [
    {
        id: 'calltype',
        numeric: false,
        disablePadding: false,
        label: 'Call Type'
    },{
        id: 'trace',
        numeric: false,
        disablePadding: false,
        label: 'Call Trace'
    }, {
        id: 'thriftMethodName',
        numeric: false,
        disablePadding: false,
        label: 'Thrift Method'
    }, {
        id: 'counts',
        numeric: true,
        disablePadding: false,
        label: 'Counts'
    }, {
        id: 'duration',
        numeric: true,
        disablePadding: false,
        label: 'Total Time (ms)'
    }, {
        id: 'max',
        numeric: true,
        disablePadding: false,
        label: 'Max Time (ms)'
    }
];

exports.FILESTACKTRACE_TABLE_COLUMNS = [
    {
        id: 'calltype',
        numeric: false,
        disablePadding: false,
        label: 'Call Type'
    },{
        id: 'trace',
        numeric: false,
        disablePadding: false,
        label: 'Stack Trace'
    }, {
        id: 'duration',
        numeric: true,
        disablePadding: false,
        label: 'Time (ms)'
    }
];

exports.SERVICE_TABLE_COLUMNS = [
    {
        id: 'name',
        numeric: false,
        disablePadding: false,
        label: 'Service > Thrift Method'
    }, {
        id: 'sqlcounts',
        numeric: true,
        disablePadding: false,
        label: 'SQL Counts'
    }, {
        id: 'rediscounts',
        numeric: true,
        disablePadding: false,
        label: 'REDIS Counts'
    }, {
        id: 'counts',
        numeric: true,
        disablePadding: false,
        label: 'Total Counts'
    }, {
        id: 'duration',
        numeric: true,
        disablePadding: false,
        label: 'Total Time (ms)'
    }
];


exports.SERVICE_DATA_TABLE_COLUMNS = [
    {
        id: 'service',
        numeric: false,
        disablePadding: false,
        label: 'Service'
    }, {
        id: 'name',
        numeric: false,
        disablePadding: false,
        label: 'Name'
    }, {
        id: 'counts',
        numeric: true,
        disablePadding: false,
        label: 'Counts'
    }, {
        id: 'duration',
        numeric: true,
        disablePadding: false,
        label: 'Duration (ms)'
    }, {
        id: 'max',
        numeric: true,
        disablePadding: false,
        label: 'Max Time (ms)'
    }
];


exports.CLASS_TABLE_COLUMNS = [
    {
        id: 'trace',
        numeric: false,
        disablePadding: false,
        label: 'Call Trace'
    }, {
        id: 'counts',
        numeric: true,
        disablePadding: false,
        label: 'Counts'
    }, {
        id: 'duration',
        numeric: true,
        disablePadding: false,
        label: 'Total Time (ms)'
    }, {
        id: 'max',
        numeric: true,
        disablePadding: false,
        label: 'Max Time (ms)'
    }
];

exports.LABEL = [{name: "Repeated Calls", count: 0}, {name: "Service Performance", count: 0}, {name: "Summary", count: 0}, {name: "Loop Detection", count:0}];