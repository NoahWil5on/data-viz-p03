let w = 400, h = 300;
let xScale;
let charts = [];

let mySwitch = false;
let byWinPercent = true;
let champs = [];
let selectedChamp;
let dataset = [];
let stackedBarChart;

//simple csv parser function parses ints for all properties of data
parseData = (d) => {
    let data = [];
    let keys = Object.keys(d);
    keys.forEach(key => {
        data[key] = parseInt(d[key]);
    });
    return data;
}
//sum and analyze data
doData = (game_data, champ_data, champ_data_2, summ_data) => {
    let myData = {};
    game_data.forEach((game) => {
        for (let i = 0; i < 10; i++) {
            let champNumber = Math.floor(i / 2) + 1;
            let teamNumber = i % 2 + 1;
            let id = game[`t${teamNumber}_champ${champNumber}id`] + "";

            //if this champion hasn't been added yet, give it initial values
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
                //setup empty summoner spell data
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
            //add all the new values
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

    //find stats per game now that we have added all values
    keys.forEach((champKey) => {
        let champ = myData[champKey];
        champ.winPercent = champ.wins / champ.games;
        champ.baronsPG = champ.barons / champ.games;
        champ.dragonsPG = champ.dragons / champ.games;
        champ.towersPG = champ.towers / champ.games;
        champ.id = champKey;
        myDataset.push(champ);
    });
    return myDataset;
}
//using just a number 1-4 get the property and property name (for showing the user) that will be used 
//with each chart
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
//4 main chart mouseover functions
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
//make standardized chart
makeChart = (chartNumber) => {
    let prop = getProperty(chartNumber);
    let property = prop.prop;
    let propertyName = prop.name;
    let xScaleOrdinal;

    //order charts
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

    let voronoi = d3.voronoi()
        .x(d => xScale(dataset.indexOf(d)))
        .y(d => yScale(d[property]))
        .extent([[20, 20], [w - 20, h - 40]]);

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

    //labeling based "byWinPercent"
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
}
//everytime there is a keypress in the search
//input field run this function, simply finds
//first 3 matching search results
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
//when a champ is searched for or clicked on run this
selectChamp = (champName) => {
    document.getElementById('results').innerHTML = '';
    document.getElementById('search-bar').value = champName;

    //set new champion globally
    let lastChamp = selectedChamp;
    for (let i = 0; i < dataset.length; i++) {
        if (dataset[i].name == champName) {
            selectedChamp = dataset[i];
            break;
        }
    }
    //setup info about champion
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

        //erase old selected champion
        if (lastChamp) {
            d3.select(`#${property}${lastChamp.id}`)
                .attr('fill', '#999')
                .attr('stroke', '#666');
        }
        //highlight new champion
        d3.select(`#${property}${selectedChamp.id}`)
            .attr('fill', '#f66')
            .attr('stroke', '#f33');
    }
    doStackedBarChart(selectedChamp);
}

//mouse events for stacked bar chart
rectOver = (d) => {
    label = document.getElementById(`summ-description`);
    label.style.visibility = "visible";
    let rect = document.getElementById(`rect${d}`).getBoundingClientRect();
    label.innerText = selectedChamp.sums[d].desc;
    label.style.top = rect.y + 10 + "px";
    label.style.left = rect.x - label.getBoundingClientRect().width / 2 + "px";
}
rectOut = (d) => {
    document.getElementById(`summ-description`).style.visibility = "hidden";
}
//creates stacked bar chart when champion is selected
doStackedBarChart = (champion) => {
    if(stackedBarChart){
        stackedBarChart.selectAll("*").remove();
    }
    let keys = Object.keys(champion.sums);
    keys = keys.filter(d => champion.sums[d].val !== 0);
    keys.sort((a,b) => {
        return champion.sums[a].val - champion.sums[b].val;
    })


    let width = 200;
    let height = 500;

    let svg = d3
        .select("#stackedBar")
        .attr("width", width)
        .attr("height", height);

    //get the sum of all summoners spells used
    let total = 0;
    for(let i = 0; i < keys.length; i++){
        total += champion.sums[keys[i]].val;
    }

    let yScale = d3.scaleLinear()
        .domain([0, total]).range([0, height - 40]);
    let cScale = d3.scaleOrdinal(d3.schemeSet3);

    //keeps track of where next rectangle will be drawn
    let currentStart = 0;

    svg.selectAll('rect')
        .data(keys)
        .enter()
        .append('rect')
        .attr('id', (d) => 'rect' + d)
        .attr('x', 0)
        .attr('y', d => {
            let temp = currentStart; 
            currentStart += yScale(champion.sums[d].val); 
            return temp;
        })
        .attr('width', 80)
        .attr('height', d => yScale(champion.sums[d].val))
        .style('fill', (d) => cScale(d))
        .on('mouseover', rectOver)
        .on('mouseout', rectOut);

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
    stackedBarChart = svg;
}
//get image from a site online for each champion
getImage = (champName) => {
    //in some rare cases we need to edit the name a little to get a working link
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
//clear all data in charts for fresh start
cleanCharts = () => {
    for (let i = 0; i < 4; i++) {
        if(charts[i]){
            charts[i].selectAll("*").remove();
        }
    }
    charts = [];
}
doCharts = () => {
    cleanCharts();
    for (let i = 0; i < 4; i++) {
        makeChart(i + 1);
    }
    if(!selectedChamp) selectedChamp = dataset[0];
    selectChamp(selectedChamp.name);
}

window.onload = () => {
    //load in all the datasets
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
                        
                        //reset charts based on toggle switches
                        document.getElementById('win-percent').addEventListener('change', (e) => {
                            byWinPercent = e.target.checked;
                            doCharts();
                        });
                        document.getElementById('show-total').addEventListener('change', (e) => {
                            mySwitch = e.target.checked;
                            doCharts()
                        });
                        //make initial charts
                        doCharts();
                    });
                });
            });
        });
    })
}

