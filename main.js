// set these chart properties globally so we can reuse
let w = 400, h = 300;
let xScale;
let charts = [];

let mySwitch = false;
let byWinPercent = true;
let champs = [];
let selectedChamp;
let dataset = [];
let stackedBarChart;


parseData = (d) => {
    let data = [];
    let keys = Object.keys(d);
    keys.forEach(key => {
        data[key] = parseInt(d[key]);
    });
    return data;
}
doData = (game_data, champ_data, champ_data_2, summ_data) => {
    let myData = {};
    game_data.forEach((game) => {
        for (let i = 0; i < 10; i++) {
            let champNumber = Math.floor(i / 2) + 1;
            let teamNumber = i % 2 + 1;
            let id = game[`t${teamNumber}_champ${champNumber}id`] + "";
            if (!myData[id]) {
                let name = champ_data.data[id].name;
                myData[id] = {
                    games: 0,
                    wins: 0,
                    towers: 0,
                    dragons: 0,
                    barons: 0,
                    sums: {},
                    name: name,
                };
                summ_keys = Object.keys(summ_data.data);
                for (let j = 0; j < summ_keys.length; j++) {
                    summ_name = summ_data.data[summ_keys[j] + ""].name;
                    description = summ_data.data[summ_keys[j] + ""].description;
                    myData[id].sums[summ_name] = {
                        name: summ_name,
                        id: summ_keys[j],
                        desc: description,
                        val: 0
                    }
                }
            }
            //t1_champ2_sum2
            myData[id].sums[summ_data.data[game[`t${teamNumber}_champ${champNumber}_sum1`] + ""].name].val++;
            myData[id].sums[summ_data.data[game[`t${teamNumber}_champ${champNumber}_sum2`] + ""].name].val++;
            myData[id].games++;
            if (teamNumber == game['winner']) myData[id].wins++;
            myData[id].towers += game[`t${teamNumber}_towerKills`];
            myData[id].dragons += game[`t${teamNumber}_dragonKills`];
            myData[id].barons += game[`t${teamNumber}_baronKills`];
        }
    });
    let keys = Object.keys(myData);
    let myDataset = [];
    keys.forEach((champKey) => {
        let champ = myData[champKey];
        champ.winPercent = champ.wins / champ.games;
        champ.baronsPG = champ.barons / champ.games;
        champ.dragonsPG = champ.dragons / champ.games;
        champ.towersPG = champ.towers / champ.games;
        champ.id = champKey;
        myDataset.push(champ);
    });
    console.log(myDataset);
    return myDataset;
}
getProperty = (chartNumber) => {
    let property = {};
    switch (chartNumber) {
        case 1:
            !mySwitch ? property.prop = 'winPercent' : property.prop = 'wins';
            !mySwitch ? property.name = 'Win Percent' : property.name = 'Total Wins';
            break;
        case 2:
            !mySwitch ? property.prop = 'baronsPG' : property.prop = 'barons';
            !mySwitch ? property.name = 'Barons Per Game' : property.name = 'Total Barons';
            break;
        case 3:
            !mySwitch ? property.prop = 'dragonsPG' : property.prop = 'dragons';
            !mySwitch ? property.name = 'Dragons Per Game' : property.name = 'Dragons';
            break;
        case 4:
            !mySwitch ? property.prop = 'towersPG' : property.prop = 'towers';
            !mySwitch ? property.name = 'Towers Per Game' : property.name = 'Total Towers';
            break;
        default:
            !mySwitch ? property.prop = 'winPercent' : property.prop = 'wins';
            !mySwitch ? property.name = 'Win Percent' : property.name = 'Total Wins';
            break;
    }
    return property;
}
vMouseOver = (d) => {
    for (let i = 0; i < 4; i++) {
        let property = getProperty(i + 1).prop;
        label = document.getElementById(`champ-label${i + 1}`);
        label.style.visibility = "visible";
        let circle = document.getElementById(`${property}${d.data.id}`).getBoundingClientRect();
        label.innerText = d.data.name;
        label.style.top = circle.y - 30 + "px";
        label.style.left = circle.x - label.getBoundingClientRect().width / 2 + "px";

        d3.select(`#${property}${d.data.id}`)
            .attr('fill', '#66f')
            .attr('stroke', '#33f');
    }
}

vMouseOut = (d) => {
    for (let i = 0; i < 4; i++) {
        document.getElementById(`champ-label${i + 1}`).style.visibility = "hidden";
        let property = getProperty(i + 1).prop;
        if (selectedChamp && d.data.id == selectedChamp.id) {
            d3.select(`#${property}${d.data.id}`)
                .attr('fill', '#f66')
                .attr('stroke', '#f33');
            continue;
        }
        d3.select(`#${property}${d.data.id}`)
            .attr('fill', '#999')
            .attr('stroke', '#666');
    }
}
makeChart = (chartNumber) => {
    let prop = getProperty(chartNumber);
    let property = prop.prop;
    let propertyName = prop.name;
    let xScaleOrdinal;

    if (byWinPercent) {
        dataset.sort((a, b) => {
            return a.winPercent - b.winPercent;
        });
        xScaleOrdinal = d3.scaleOrdinal()
            .domain(['Low', 'High'])
            .range([60, w - 20]);
    } else {
        dataset.sort((a, b) => {
            if (a.name < b.name) { return -1; }
            if (a.name > b.name) { return 1; }
            return 0;
        });
        xScaleOrdinal = d3.scaleOrdinal()
            .domain(['A', 'Z'])
            .range([60, w - 20]);
    }
    let yExtent = d3.extent(dataset, d => d[property]);
    let myPadding = (yExtent[1] - yExtent[0]) * .05;
    yExtent[0] = yExtent[0] - myPadding;
    yExtent[1] = yExtent[1] + myPadding;
    let yScale = d3.scaleLinear()
        .domain(yExtent)
        .range([h - 40, 20]);
    xScale = d3.scaleLinear()
        .domain([-4, dataset.length + 4])
        .range([60, w - 20]);

    let chart = d3.select(`#chart${chartNumber}`)
        .attr('width', w)
        .attr('height', h);

    //   let line = d3.line()
    //                   .x(d => xScale(d.date))
    //                   .y(d => yScale(d[property]));

    let voronoi = d3.voronoi()
        .x(d => xScale(dataset.indexOf(d)))
        .y(d => yScale(d[property]))
        .extent([[20, 20], [w - 20, h - 40]]);

    //   //Bind data and create one path per GeoJSON feature
    //   chart.append("path")
    //       .datum(dataset)
    //       .attr("d", line)
    //       .style('stroke', 'lightgray')
    //       .style('stroke-width', '2px')
    //       .style('fill', 'none');

    chart.selectAll("circle")
        .data(dataset)
        .enter()
        .append("circle")
        .attr('id', d => property + d.id)
        .attr('cx', d => xScale(dataset.indexOf(d)))
        .attr('cy', d => yScale(d[property]))
        .attr('r', 5)
        .attr('stroke-width', 2)
        .attr('fill', '#999')
        .attr('stroke', '#666');

    chart.selectAll('.voronoi')
        .data(voronoi.polygons(dataset).filter(d => d != null))
        .enter()
        .append('path')
        .classed('voronoi', true)
        .attr('d', d => "M" + d.join('L') + "Z")
        .style('fill', 'none')
        .style('stroke', 'none')
        .style('pointer-events', 'all')
        .on('mouseover', vMouseOver)
        .on('mouseout', vMouseOut)
        .on('click', d => selectChamp(d.data.name));



    let xAxis = d3.axisBottom(xScaleOrdinal)
        .ticks(2);
    let yAxis = d3.axisLeft(yScale).
        ticks(6);

    chart.append('g')
        .call(xAxis)
        .attr('transform', `translate(0, ${h - 40})`);
    chart.append('g')
        .call(yAxis)
        .attr('transform', `translate(60, 0)`);


    chart.append('text')
        .classed('yaxis-label', true)
        .attr('y', 20)
        .attr('x', -h / 2 + 20)
        .text(propertyName);

    if (!byWinPercent) {
        chart.append('text')
            .classed('xaxis-label', true)
            .attr('y', h - 20)
            .attr('x', w / 2 + 40)
            .text("Champion Name");
    } else {
        chart.append('text')
            .classed('xaxis-label', true)
            .attr('y', h - 20)
            .attr('x', w / 2 + 40)
            .text("Win Rate");
    }




    charts.push(chart);

    //   // gave you all this one...
    //   chart.append('line')
    //       .classed('vline', true)
    //       .classed('hidden', true)
    //       .attr('id', property + '-line')
    //       .attr('y1', 20)
    //       .attr('y2', h - 40);
}
doSearch = () => {
    let myHtml = '';
    let myInput = document.getElementById('search-bar').value;
    if (myInput == '') {
        document.getElementById('results').innerHTML = myHtml;
        return;
    }

    myResults = champs.filter((d) => d.toLowerCase().includes(myInput.toLowerCase()));
    for (let i = 0; i < 3 && i < myResults.length; i++) {
        myName = myResults[i].replace(/["']/g, "\\'");
        myHtml += `<p onclick="selectChamp('${myName}')">${myResults[i]}</p>`;
    }
    document.getElementById('results').innerHTML = myHtml;
}
selectChamp = (champName) => {
    document.getElementById('results').innerHTML = '';
    document.getElementById('search-bar').value = champName;
    let lastChamp = selectedChamp;
    for (let i = 0; i < dataset.length; i++) {
        if (dataset[i].name == champName) {
            selectedChamp = dataset[i];
            break;
        }
    }
    document.getElementById('champ-data').style = "visibility: visible";
    document.getElementById('champ-name').innerText = champName;
    document.getElementById('champ-image').src = getImage(champName);
    document.getElementById('champ-info').innerHTML = `
        <p><b>Total Games: </b>${selectedChamp.games}</p>
        <p><b>Total Wins: </b>${selectedChamp.wins}</p>
        <p><b>Win Percent: </b>${selectedChamp.winPercent.toFixed(2)}</p>
        <p><b>Baron Kills: </b>${selectedChamp.barons}</p>
        <p><b>Dragon Kills: </b>${selectedChamp.dragons}</p>
        <p><b>Towers Destroyed: </b>${selectedChamp.towers}</p>
        <p><b>Barons Per Game: </b>${selectedChamp.baronsPG.toFixed(2)}</p>
        <p><b>Dragons Per Game: </b>${selectedChamp.dragonsPG.toFixed(2)}</p>
        <p><b>Towers Per Game: </b>${selectedChamp.towersPG.toFixed(2)}</p>
    `;

    for (let i = 0; i < 4; i++) {
        let property = getProperty(i + 1).prop;
        if (lastChamp) {
            d3.select(`#${property}${lastChamp.id}`)
                .attr('fill', '#999')
                .attr('stroke', '#666');
        }
        d3.select(`#${property}${selectedChamp.id}`)
            .attr('fill', '#f66')
            .attr('stroke', '#f33');
    }
    doStackedBarChart(selectedChamp);
}
doStackedBarChart = (champion) => {
    if(stackedBarChart){
        stackedBarChart.selectAll("*").remove();
    }
    // let data = [];
    let keys = Object.keys(champion.sums);
    keys = keys.filter(d => champion.sums[d].val !== 0);
    // for(let i = 0; i < keys.length; i++){
    //     data.values[keys[i]] = champion.sums[keys[i]].val;
    // }


    let width = 200;
    let height = 500;

    let svg = d3
        .select("#stackedBar")
        .attr("width", width)
        .attr("height", height);

    let total = 0;
    for(let i = 0; i < keys.length; i++){
        total += champion.sums[keys[i]].val;
    }

    let yScale = d3.scaleLinear()
        .domain([0, total]).range([0, height - 40]);
    let cScale = d3.scaleOrdinal(d3.schemeSet3);

    let currentStart = 0;
    svg.selectAll('rect')
        .data(keys)
        .enter()
        .append('rect')
        .attr('x', d => 0)
        .attr('y', d => {
            let temp = currentStart; 
            currentStart += yScale(champion.sums[d].val); 
            return temp;
        })
        .attr('width', 80)
        .attr('height', d => yScale(champion.sums[d].val))
        .style('fill', (d) => cScale(d));

    // let xAxis = d3.axisBottom(xScale)
    //     .ticks(data.length + 1)
    //     .tickFormat(d3.format('.0f'));

    // svg.append("g")
    //     .attr("transform", `translate(0, ${h - 40})`)
    //     .call(xAxis);

    // let yAxis = d3.axisLeft(yScale);
    // svg.append("g")
    //     .attr("transform", `translate(80, 0)`)
    //     .call(yAxis);

    // LEGEND
    let legendScale = d3.scaleOrdinal()
        .domain(keys)
        .range(d3.schemeSet3);

    svg.append("g")
        .attr("class", "legendOrdinal")
        .attr("transform", "translate(100,20)");

    let legendOrdinal = d3.legendColor()
        .shape("path", d3.symbol().type(d3.symbolSquare).size(60)())
        .shapePadding(10)
        .scale(legendScale);

    svg.select(".legendOrdinal")
        .call(legendOrdinal);

    // svg.append('text')
    //     .classed('axis-label', true)
    //     .attr('transform', 'rotate(-90)')
    //     .attr('x', -h / 2)
    //     .attr('y', 20)
    //     .attr('text-anchor', 'middle')
    //     .text('Total Income')

    // svg.append('text')
    //     .classed('axis-label', true)
    //     .attr('x', w / 2)
    //     .attr('y', h - 5)
    //     .attr('text-anchor', 'middle')
    //     .text('Year')
    stackedBarChart = svg;
}
getImage = (champName) => {
    switch (champName) {
        case 'LeBlanc':
            champName = 'Leblanc';
            break;
        case "Cho'Gath":
            champName = 'Chogath';
            break;
        case "Kha'Zix":
            champName = 'Khazix';
            break;
        case "Wukong":
            champName = 'MonkeyKing';
            break;
        default:
            break;
    }
    let myChamp = champName.replace(/[^a-z0-9+]+/gi, '');
    return `https://ddragon.leagueoflegends.com/cdn/9.8.1/img/champion/${myChamp}.png`;
}
cleanCharts = () => {
    for (let i = 0; i < 4; i++) {
        charts[i].selectAll("*").remove();
    }
    charts = [];
}

window.onload = () => {
    d3.csv('./assets/lol/games.csv', parseData).then((game_data) => {
        d3.json('./assets/lol/champion_info.json').then((champ_data) => {
            d3.json('./assets/lol/champion_info_2.json').then((champ_data_2) => {
                d3.json('./assets/lol/summoner_spell_info.json').then((summ_data) => {

                    let keys = Object.keys(champ_data.data);
                    keys.forEach((champ) => {
                        champs.push(champ_data.data[champ].name);
                    })
                    new Promise((resolve, reject) => {
                        resolve(doData(game_data, champ_data, champ_data_2, summ_data));
                    }).then((myData) => {
                        dataset = myData;
                        document.getElementById('win-percent').addEventListener('change', (e) => {
                            byWinPercent = e.target.checked;
                            cleanCharts();
                            for (let i = 0; i < 4; i++) {
                                makeChart(i + 1);
                            }
                            if (selectedChamp) selectChamp(selectedChamp.name);
                        });
                        document.getElementById('show-total').addEventListener('change', (e) => {
                            mySwitch = e.target.checked;
                            cleanCharts();
                            for (let i = 0; i < 4; i++) {
                                makeChart(i + 1);
                            }
                            if (selectedChamp) selectChamp(selectedChamp.name);
                        });
                        for (let i = 0; i < 4; i++) {
                            makeChart(i + 1);
                        }
                    });



                });
            });
        });
    })
}

