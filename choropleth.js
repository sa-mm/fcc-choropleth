// @ts-check
// https://bl.ocks.org/mbostock/4060606

const svg = d3.select('svg')
const width = +svg.attr('width')
const height = +svg.attr('height')
const path = d3.geoPath()

const eduURL = 'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json'
const countiesURL = 'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json'

svg.append('text')
  .attr('x', width / 3)
  .attr('y', 20)
  .attr('id', 'title')
  .text('United States Educational Attainment')

d3.queue()
  .defer(d3.json, countiesURL)
  .defer(d3.json, eduURL)
  .await(ready)

function ready (error, us, degrees) {
  if (error) throw error
  // console.log(us)
  // console.log(degrees)

  const degreeRates = degrees.map(e => e.bachelorsOrHigher)
  const maxRate = d3.max(degreeRates)
  const minRate = d3.min(degreeRates)
  var x = d3.scaleLinear()
    .domain([0, maxRate])
    .rangeRound([600, 860])

  var color = d3.scaleThreshold()
    .domain(d3.range(minRate, maxRate, (maxRate - minRate) / 8))
    .range(d3.schemeBlues[9])

  var g = svg.append('g')
    .attr('class', 'key')
    .attr('transform', 'translate(0,40)')
    .attr('id', 'legend')

  g.selectAll('rect')
    .data(color.range().map(function (d) {
      d = color.invertExtent(d)
      if (d[0] == null) d[0] = x.domain()[0]
      if (d[1] == null) d[1] = x.domain()[1]
      return d
    }))
    .enter().append('rect')
    .attr('height', 8)
    .attr('x', function (d) { return x(d[0]) })
    .attr('width', function (d) { return x(d[1]) - x(d[0]) })
    .attr('fill', function (d) { return color(d[0]) })

  g.append('text')
    .attr('class', 'caption')
    .attr('x', x.range()[0])
    .attr('y', -6)
    .attr('fill', '#000')
    .attr('text-anchor', 'start')
    .attr('font-weight', 'bold')
    .text("Percentage of adults with bachelor's degree or higher")
    .attr('id', 'description')

  g.call(d3.axisBottom(x)
    .tickSize(13)
    .tickFormat((x, i) => Math.round(x) + '%')
    .tickValues(color.domain()))
    .select('.domain')
    .remove()

  const tooltip = d3.select('body')
    .append('div')
    .style('position', 'absolute')
    .style('z-index', '10')
    .style('visibility', 'hidden')
    .attr('id', 'tooltip')

  const onMouseOverCB = (d, i) => {
    tooltip.text(d[0])
    tooltip.attr('data-education', d.rate)
    return tooltip.style('visibility', 'visible')
  }

  svg.append('g')
    .attr('class', 'counties')
    .selectAll('path')
    .data(topojson.feature(us, us.objects.counties).features)
    .enter().append('path')
    .attr('fill', d => {
      const matchedCounty = degrees.find(county => county.fips === d.id)
      return matchedCounty ? color(d.rate = matchedCounty.bachelorsOrHigher) : color(0)
    })
    .attr('d', path)
    .attr('data-fips', d => {
      const matchedCounty = degrees.find(county => county.fips === d.id)
      return matchedCounty.fips
    })
    .attr('data-education', d => d.rate)
    .classed('county', true)
    .on('mouseover', onMouseOverCB)
    .on('mousemove', function () { return tooltip.style('top', (d3.event.pageY - 10) + 'px').style('left', (d3.event.pageX + 10) + 'px') })
    .on('mouseout', function () { return tooltip.style('visibility', 'hidden') })
    .append('title')
    .text(d => d.rate + '%')

  svg.append('path')
    .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
    .attr('class', 'states')
    .attr('d', path)
}
