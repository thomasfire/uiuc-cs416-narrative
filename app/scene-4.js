

const CHART_NAMES = {
    "diff_mort_rent": "Mortgage - Rent Difference per sq.m., HKD",
    "downpayment": "30% Down Payment per sq.m., HKD",
    "mortgage_payment": "Monthly Mortgage Payment with 70% LTV for 30 Years, HKD",
    "price_to_rent": "Sale Price to Annual Rent Ratio"
}

class Scene4 {
    constructor() {
        if (Scene4.instance) {
            return Scene4.instance;
        }

        this.width = 0;
        this.height = 0;
        this.svgId = '';
        this.dataUrl = '';
        this.data = [];
        this.filterClasses = ['Class A', 'Class B', 'Class C', 'Class D', 'Class E'];
        this.filterTerritories = ['Hong Kong', 'Kowloon', 'New Territories'];
        this.chartSelection = "diff_mort_rent";

        Scene4.instance = this;
        return this;
    }

    init(width, height, svgId, dataUrl) {
        this.width = width;
        this.height = height;
        this.svgId = svgId;
        this.dataUrl = dataUrl;

        return this;
    }

    updateSize(width, height) {
        console.log('Resizing');
        this.width = width;
        this.height = height;
        return this.render();
    }

    loadData() {
        d3.json(this.dataUrl).then((loadedData) => {
            this.data = loadedData;
            this.render();
        }).catch((error) => {
            console.error('Error loading data:', error);
        });
        return this;
    }

    addClassFilter(className) {
        if (!this.filterClasses.includes(className)) {
            this.filterClasses.push(className);
        }
        return this.render();
    }

    removeClassFilter(className) {
        const index = this.filterClasses.indexOf(className);
        if (index !== -1) {
            this.filterClasses.splice(index, 1);
        }
        return this.render();
    }

    addTerritoryFilter(territoryName) {
        if (!this.filterTerritories.includes(territoryName)) {
            this.filterTerritories.push(territoryName);
        }
        return this.render();
    }

    removeTerritoryFilter(territoryName) {
        const index = this.filterTerritories.indexOf(territoryName);
        if (index !== -1) {
            this.filterTerritories.splice(index, 1);
        }
        return this.render();
    }

    addLineFilter(lineName) {
        const [className, territoryName] = [lineName.substring(0, 7), lineName.substring(8)];
        this.addClassFilter(className);
        this.addTerritoryFilter(territoryName);
    }
    removeLineFilter(lineName) {
        const [className, territoryName] = [lineName.substring(0, 7), lineName.substring(8)];
        this.removeClassFilter(className);
        this.removeTerritoryFilter(territoryName);
    }

    doesMatch(columnName) {
        if (columnName === 'Year') {
            return true;
        }
        const hasClass = this.filterClasses.filter(c => columnName.includes(c)).length > 0;
        const hasTerritory = this.filterTerritories.filter(c => columnName.includes(c)).length > 0;
        return (this.filterClasses.length === 0 || hasClass) &&
            (this.filterTerritories.length === 0 || hasTerritory);
    }

    updateChartSelection(selection) {
        this.chartSelection = selection;
        return this.render();
    }


    render() {
        console.log('Rendering D3 visualization');
        console.log('Size:', this.width, 'x', this.height);
        console.log('SVG ID:', this.svgId);
        console.log('Data URL:', this.dataUrl);
        console.log('Data:', this.data);

        d3.select(`#${this.svgId}`)
            .attr('width', this.width)
            .attr('height', this.height)
            .selectAll('*')
            .remove();
        const filteredData = this.data.map(d => {
            return {
                ...Object.fromEntries(Object.entries(d)
                    .filter(([k, v]) => this.doesMatch(k)))
            };
        });

        const allYears = Array.from(new Set(filteredData
            .map(row => row["Year"])))
            .sort();
        const allValues = filteredData
            .flatMap(d => Object.entries(d)
                .filter(([k, v]) => k !== 'Year')
                .map(([k, v]) => +v[this.chartSelection]))
            .filter(v => !isNaN(v));
        const  allClasses = Array.from(new Set(filteredData
            .flatMap(d => Object.keys(d)
                .filter(k => k !== 'Year'))))
            .sort();
        console.log('All values:', allValues);

        const minValue = Math.min(...allValues) - Math.abs(Math.min(...allValues))*0.05;
        const maxValue = Math.max(...allValues) + Math.abs(Math.max(...allValues))*0.05;

        const margin = {top: 40, right: 40, bottom: 80, left: 80};
        const innerWidth = this.width - margin.left - margin.right;
        const innerHeight = this.height - margin.top - margin.bottom;

        const xScale = d3.scaleBand()
            .domain(allYears)
            .range([0, innerWidth])
            .padding(0.1);

        const yScale = d3.scaleLinear()
            .domain([minValue, maxValue])
            .range([innerHeight, 0]);


        const svg = d3.select(`#${this.svgId}`);

        const chartGroup = svg.append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        chartGroup.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${innerHeight})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end');

        chartGroup.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(yScale));

        svg.append('text')
            .attr('class', 'x-axis-label')
            .attr('transform', `translate(${this.width / 2}, ${this.height - 10})`)
            .style('text-anchor', 'middle')
            .text('Years');

        svg.append('text')
            .attr('class', 'y-axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('y', 20)
            .attr('x', 0 - (this.height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .text(CHART_NAMES[this.chartSelection]);

        let activeAnnotation = null;

        // Create data points for hover/click interactions
        allClasses.forEach(className => {
            const lineData = this.data.map(d => ({
                year: d["Year"],
                value: +d[className][this.chartSelection]
            })).filter(d => !isNaN(d.value));
            
            // Draw line
            chartGroup.append("path")
                .datum(lineData)
                .attr("fill", "none")
                .attr("stroke", LINE_COLORS[className])
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                    .x(d => xScale(d.year) + xScale.bandwidth() / 2)
                    .y(d => yScale(d.value))
                    .curve(d3.curveCatmullRom.alpha(0.5))
                );
            
            // Create small data point circles
            chartGroup.selectAll(`.point-${className.replace(/\s+/g, '-')}`)
                .data(lineData)
                .enter()
                .append('circle')
                .attr('class', `point point-${className.replace(/\s+/g, '-')}`)
                .attr('cx', d => xScale(d.year) + xScale.bandwidth() / 2)
                .attr('cy', d => yScale(d.value))
                .attr('r', 2.5) // Small radius
                .attr('fill', LINE_COLORS[className])
                .attr('data-year', d => d.year)
                .attr('data-class', className)
                .on('mouseover', (event, d) => {
                    // Highlight point on hover
                    d3.select(event.target)
                        .attr('r', 4);
                    const fullDataObject = this.data.find(fd => fd["Year"] === d.year)[className] || {};
                    const shouldBeRight  = xScale(d.year) + xScale.bandwidth() / 2 < this.width / 2;
                    const shouldBeTop  = yScale(d.value) > this.height / 2;
                    
                    // Create annotation without connector
                    const annotationData = [{
                        note: {
                            label: `
                                Down payment with 70% LTV: ${(fullDataObject.downpayment / 1000).toFixed(1)}K
                                Mortgage payment, 30 years, 70% LTV: ${(+fullDataObject.mortgage_payment).toFixed(2)}
                                Sale Price to annual rent ratio: ${(+fullDataObject.price_to_rent).toFixed(2)}
                                Mortgage - rent payments: ${fullDataObject.diff_mort_rent.toFixed(2)}
                                `,
                            title: `${d.year.toString()} ${className}`, bgPadding: 5, padding: 5,
                            wrap: 280, wrapSplitter: /\n/
                        },
                        x: xScale(d.year) + xScale.bandwidth() / 2,
                        y: yScale(d.value),
                        className: "annotation-bg",
                        dy: shouldBeTop ? -20 : 40,
                        dx: shouldBeRight ? 20 : -100,
                        connector: { end: "none" } // No connector line
                    }];
                    
                    const makeAnnotations = d3.annotation()
                        .type(d3.annotationLabel)
                        .annotations(annotationData)
                    ;

                    chartGroup.selectAll('.annotation-group').remove();

                    chartGroup.append("g")
                        .attr("class", "annotation-group")
                        .call(makeAnnotations);
                })
                .on('mouseout', (event, d) => {
                    d3.select(event.target)
                        .attr('r', 2);

                    if (!activeAnnotation) {
                        chartGroup.selectAll('.annotation-group').remove();
                    }
                })
                .on('click', (event, d) => {
                    activeAnnotation = {
                        year: d.year,
                        className: className,
                        value: d.value
                    };

                    d3.select(event.target)
                        .attr('r', 4);
                    const fullDataObject = this.data.find(fd => fd["Year"] === d.year)[className] || {};
                    const shouldBeRight  = xScale(d.year) + xScale.bandwidth() / 2 < this.width / 2;
                    const shouldBeTop  = yScale(d.value) > this.height / 2;

                    const annotationData = [{
                        note: {
                            label: `
                                Down payment with 70% LTV: ${(fullDataObject.downpayment / 1000).toFixed(1)}K
                                Mortgage payment, 30 years, 70% LTV: ${(+fullDataObject.mortgage_payment).toFixed(2)}
                                Sale Price to annual rent ratio: ${(+fullDataObject.price_to_rent).toFixed(2)}
                                Mortgage - rent payments: ${fullDataObject.diff_mort_rent.toFixed(2)}
                                `,
                            title: `${d.year.toString()} ${className}`, bgPadding: 5, padding: 5,
                            wrap: 280, wrapSplitter: /\n/
                        },
                        x: xScale(d.year) + xScale.bandwidth() / 2,
                        y: yScale(d.value),
                        className: "annotation-bg",
                        dy: shouldBeTop ? -20 : 40,
                        dx: shouldBeRight ? 20 : -100,
                        connector: { end: "none" } // No connector line
                    }];
                    
                    const makeAnnotations = d3.annotation()
                        .type(d3.annotationLabel)
                        .annotations(annotationData);

                    chartGroup.selectAll('.annotation-group').remove();

                    chartGroup.append("g")
                        .attr("class", "annotation-group")
                        .call(makeAnnotations);
                });
        });

        const eventAnnotations = Object.entries(EVENTS).map(([year, eventName], index) => {

            if (!xScale.domain().includes(year)) return null;
            
            return {
                note: {
                    label: eventName,
                    bgPadding: 5,
                    padding: 5
                },
                x: xScale(year) + xScale.bandwidth() / 2,
                y: 50,
                dy: -10 - (index * 5),
                dx: index === 2 ? -40 : index === 4 ? 40 : -5,
                year: year
            };
        }).filter(annotation => annotation !== null);

        eventAnnotations.forEach(annotation => {
            const year = annotation.year;

            chartGroup.append('line')
                .attr('x1', xScale(year) + xScale.bandwidth() / 2)
                .attr('x2', xScale(year) + xScale.bandwidth() / 2)
                .attr('y1', 0)
                .attr('y2', innerHeight)
                .attr('stroke', 'red')
                .attr('stroke-width', 1);
        });

        const makeAnnotations = d3.annotation()
            .type(d3.annotationLabel)
            .annotations(eventAnnotations);

        chartGroup.append("g")
            .attr("class", "annotation-group-event")
            .call(makeAnnotations);


        return this;
    }
}

const scene4 = new Scene4();

document.addEventListener('DOMContentLoaded', function () {

    const sceneGraphElement = document.getElementById('scene_graph_4');
    if (sceneGraphElement) {
        const width = sceneGraphElement.offsetWidth * 0.95;
        const height = width * 3 / 4;
        scene4.init(width, height, 'scene_svg_4', '/data/combined_data.json')
            .loadData();
    } else {
        console.error('Element with id "scene_graph_4" not found');
    }
});

window.addEventListener('resize', function () {
    const sceneGraphElement = document.getElementById('scene_graph_4');
    if (sceneGraphElement) {
        const width = sceneGraphElement.offsetWidth * 0.95;
        const height = width * 3 / 4;
        scene4.updateSize(width, height);
    } else {
        console.error('Element with id "scene_graph_4" not found');
    }
});


