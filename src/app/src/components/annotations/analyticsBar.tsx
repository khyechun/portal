import React, { memo } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

interface AnalyticsProps {
  analyticsData: any
  handleChartClick: (time: number) => void
}

export default memo(function AnalyticsBar(props: AnalyticsProps): React.ReactElement {
  const { handleChartClick, analyticsData } = props
  const dataPointIndexToFrameIndexMap = analyticsData.analyticsData[0].data.map((item: any) => item.y[0])

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
        const occurences = analyticsData.annotationOccurences[dataPointIndexToFrameIndexMap[dataPointIndex]]
        let elements = ''
        Object.keys(occurences).forEach((key) => { elements += `<div>${key} : ${occurences[key]}</div>` })
        return '<div style="padding:5px;">' +
          '<span style="color:black">' + elements + '</span>' +
          '</div>'
      }
    }
  }

  if (!analyticsData.analyticsData[0].data.length) {
    return <div>No annotations for this confidence level.</div>
  }

  return <Chart
    options={options}
    series={analyticsData.analyticsData}
    type="rangeBar"
    height={120} />
})
