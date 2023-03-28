import { useEffect, useRef, useState } from "react";
import WebView from "react-native-webview";
import * as Notification from "expo-notifications";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { useDispatch } from "react-redux";
import { setWebviewToken } from "../store/slices/userInfoSlice";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { ActivityIndicator, Platform, View, StatusBar } from "react-native";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from "react-native-google-mobile-ads";

const adUnitId = __DEV__
  ? TestIds.BANNER
  : "ca-app-pub-1192136275433069/7264996283";

const VERSION = "1";

Notification.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function WebApp() {
  const dispatch = useDispatch();
  const userInfo = useSelector((state: RootState) => state.userInfo);
  const [isLoading, setIsLoading] = useState(true);
  const [isBanner, setIsBanner] = useState(false);

  useEffect(() => {
    const getPermission = async () => {
      if (Constants.isDevice) {
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== "granted") {
          alert("Enable push notifications to use the app!");
          return;
        }
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        dispatch(setWebviewToken(token));
      } else {
        alert("Must use physical device for Push Notifications");
      }

      if (Platform.OS === "android") {
        Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }
    };

    getPermission();
  }, [userInfo]);

  const webviewRef = useRef<WebView>(null);

  function sendDataToWebView() {
    webviewRef?.current?.postMessage(VERSION);
  }

  useEffect(() => {
    let interval: NodeJS.Timer | undefined = undefined;
    if (!isLoading && webviewRef.current) {
      interval = setInterval(() => sendDataToWebView(), 1000);
    }
    return () => {
      clearInterval(interval);
    };
  }, [isLoading, webviewRef]);

  const ActivityIndicatorElement = () => {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#363741",
        }}
      >
        <ActivityIndicator color="white" size="large" />
      </View>
    );
  };

  return (
    <>
      {Platform.OS === "web" ? (
        <iframe
          src={"https://chat-gpt-nzna.onrender.com"}
          height={"100%"}
          width={"100%"}
        />
      ) : (
        <>
          {isLoading && ActivityIndicatorElement()}
          <View
            style={
              isLoading
                ? {}
                : { width: "100%", height: "100%", backgroundColor: "#FFF" }
            }
          >
            {isBanner && (
              <BannerAd
                unitId={adUnitId}
                size={BannerAdSize.FULL_BANNER}
                requestOptions={{
                  requestNonPersonalizedAdsOnly: true,
                }}
              />
            )}

            <WebView
              ref={webviewRef}
              source={{
                uri: "https://chat-gpt-nzna.onrender.com",
              }}
              userAgent={
                Platform.OS === "android"
                  ? "Chrome/18.0.1025.133 Mobile Safari/535.19"
                  : "AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/56.0.2924.75"
              }
              onLoad={() => setIsLoading(false)}
              onMessage={(e) => {
                const response = JSON.parse(e.nativeEvent.data);
                setIsBanner(response.adv === "banner");
              }}
            />
            <StatusBar backgroundColor="#282829" barStyle="light-content" />
          </View>
        </>
      )}
    </>
  );
}
