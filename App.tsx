import { StatusBar } from "react-native";
import { Provider as ReduxProvider } from "react-redux";
import WebApp from "./components/WebApp";
import store from "./store/store";

export default function App() {
  return (
    <>
      <StatusBar backgroundColor={"#211f20"} barStyle={"light-content"} />
      <ReduxProvider store={store}>
        <WebApp />
      </ReduxProvider>
    </>
  );
}
