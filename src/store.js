const store={
    ws: new WebSocket("wss://api.huobiasia.vip/ws"),
    onDataCallback: null,
    onRealTimeCallback: null,
    to: null
}
export default store