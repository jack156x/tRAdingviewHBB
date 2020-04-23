/* eslint-disable */
<template>
  <div class="containers">
    <div id="chartTrading"></div>
  </div>
</template>
<script>
var TiWidget = window.TradingView.widget;
import pako from 'pako';
import DataFeeds from '../datafeed';
import store from '../store'
export default {
  name: 'TVChartContainer',
  data () {
    return {
      widget: null
    }
  },
  created () {
    this.$nextTick(() => {
      this.createWidget()
      this.message()
    })
  },
  methods: {
    toDouble: (time) => {
      if (String(time).length < 2) return "0" + time;
      return time;
    },
    message () {
      store.ws.onmessage = e => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = JSON.parse(pako.ungzip(reader.result, { to: "string" }));
          if (res.ping) {
            store.ws.send(JSON.stringify({ pong: new Date().getTime() }));
          }
          if (res.rep) {
            let datas = [];
            for (let data of res.data) {
              datas.push({
                time: data.id * 1000,
                close: data.close,
                open: data.open,
                high: data.high,
                low: data.low,
                volume: data.amount
              })
            }
            store.onDataCallback(datas, { noData: !datas.length })
          }
          if (res.tick) {
            const data = res.tick;
            store.onRealTimeCallback({
              time: data.id * 1000,
              volume: data.amount,
              close: data.close,
              open: data.open,
              high: data.high,
              low: data.low
            })
          }
        };
        reader.readAsArrayBuffer(e.data)
      }
    },
    createWidget () {
      const tv = window.tvWidget = new TiWidget({
        debug: false,
        symbol: "btcusdt",
        timezone: "Asia/Shanghai",
        fullscreen: true,
        interval: '1',
        container_id: "chartTrading",
        library_path: "/custom_scripts/chart_main/",
        locale: "zh",
        autosize: true,
        datafeed: new DataFeeds(store),
        drawings_access: { type: 'black', tools: [{ name: "Regression Trend" }] },
        favorites: {
          intervals: ['1', '5', '15', '30', '60', "240", '1D']
        },
        theme: "Light",
        customFormatters: {
          timeFormatter: {
            format: (date) => {
              var _format_str = '%h:%m';
              return _format_str.replace('%h', this.toDouble(date.getUTCHours()), 2).replace('%m', this.toDouble(date.getUTCMinutes()), 2).replace('%s', date.getUTCSeconds(), 2);
            }
          },
          dateFormatter: {
            format: (date) => {
              return date.getUTCFullYear() + '-' + this.toDouble(date.getUTCMonth() + 1) + '-' + this.toDouble(date.getUTCDate());
            }
          }
        },
        disabled_features: [ //禁用功能
          'header_symbol_search',
          'symbol_search_hot_key',
          'header_compare',
          'header_undo_redo',
          'header_screenshot',
          'volume_force_overlay',
        ],
        enabled_features: [
          "dont_show_boolean_study_arguments", //是否隐藏指标参数
          "hide_last_na_study_output", //隐藏最后一次指标输出
          "same_data_requery",
          "side_toolbar_in_fullscreen_mode",
          'adaptive_logo',
        ]
      });
      tv.onChartReady(() => {
        const chart = tv.chart();
        // 出现均线在0刻度，注意数据类型为number
        const colors = ["#e0d283", "#92c580", "#8dc1d9"];
        [5, 10, 30].map((time, index) => {
          //创建均线
          chart.createStudy("Moving Average", false, false, [time, 'close'], null, {
            'Plot.linewidth': 2,
            "plot.color": colors[index],
            "precision": 2
          });
        });
      })
      this.widget = tv; //保存图表对象
    },
    updateWidget () {
      this.removeWidget();
      this.createWidget();
    },
    removeWidget () {
      if (this.widget) {
        this.widget = null;
      }
    }
  },
  destroyed () {
    this.removeWidget();
  }
}
</script>

<style lang="scss" scoped>
.TVChartContainer {
  height: calc(100vh - 50%);
}
</style>
