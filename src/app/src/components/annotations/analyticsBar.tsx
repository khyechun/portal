import React, { memo, useEffect, useState, useRef } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

interface AnalyticsProps {
  confidence: number;
  currVideoAnnotation: {
    fps: number;
    frames: any
  };
  frameInterval: number;
  handleChartClick: (time: number) => void
}

export default memo(function AnalyticsBar(props: AnalyticsProps): React.ReactElement {
  const { confidence, currVideoAnnotation, frameInterval, handleChartClick } = props
  const [analyticsData, setAnalyticsData] = useState([{ data: [] }]);
  const annotationOccurences: any = useRef({})
  const dataPointIndexToFrameIndexMap: any = useRef({})

  useEffect(() => {
    if (!currVideoAnnotation) return
    parseSeriesData()
  }, [confidence, currVideoAnnotation])

  const options: ApexOptions = {
    chart: {
      height: 350,
      type: "rangeBar",
      events: {
        dataPointSelection: (event: any, chartContext: any, config: any) => {
          const time = config.w.globals.seriesRangeStart[0][config.dataPointIndex]
          handleChartClick(time / 1000)
        }
      }
    },
    plotOptions: {
      bar: {
        horizontal: true
      }
    },
    xaxis: {
      type: "datetime",
      labels: {
        format: "mm:ss"
      }
    },
    tooltip: {
      custom: ({ dataPointIndex }: any) => {
        const occurences = annotationOccurences.current[dataPointIndexToFrameIndexMap.current[dataPointIndex]]
        let elements = ''
        Object.keys(occurences).forEach((key) => { elements += `<div>${key} : ${occurences[key]}</div>` })
        return '<div style="padding:5px;">' +
          '<span style="color:black">' + elements + '</span>' +
          '</div>'
      }
    }
  }

  const parseSeriesData = () => {
    annotationOccurences.current = {}
    const series: any = [{ data: [] }]
    const secondsInterval = frameInterval / currVideoAnnotation.fps;
    let currSecond = 0
    let frameIndex = 0
    let dataPointIndex = 0
    Object.keys(currVideoAnnotation.frames).forEach((key) => {
      annotationOccurences.current[frameIndex] = {}
      for (const item of currVideoAnnotation.frames[key]) {
        const isOverConfidenceLevel = item.confidence > confidence
        if (annotationOccurences.current[frameIndex][item.tag.name] === undefined && isOverConfidenceLevel) {
          annotationOccurences.current[frameIndex][item.tag.name] = 0
        } else if (isOverConfidenceLevel) {
          annotationOccurences.current[frameIndex][item.tag.name]++
        }
        if (isOverConfidenceLevel && annotationOccurences.current[frameIndex][item.tag.name] === 0) {
          const data = {
            x: item.tag.name,
            y: [
              new Date(currSecond * 1000).getTime(),
              new Date((currSecond + secondsInterval) * 1000).getTime()
            ]
          }
          annotationOccurences.current[frameIndex][item.tag.name]++
          series[0].data.push(data)
          dataPointIndexToFrameIndexMap.current[dataPointIndex] = frameIndex
          dataPointIndex++
        }
      }
      currSecond += secondsInterval
      frameIndex++
    })
    setAnalyticsData(series)
  };

  if (!analyticsData[0].data.length) {
    return <div>No annotations for this confidence level.</div>
  }

  return <Chart
    options={options}
    series={analyticsData}
    type="rangeBar"
    height={120} />
})
