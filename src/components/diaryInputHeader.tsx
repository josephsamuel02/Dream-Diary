import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";

const DiaryInputHeader = ({ navigation }: any) => {
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();

      // Format date → e.g., Sep 2, 2025
      const dateOptions: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
        year: "numeric",
      };
      const formattedDate = now.toLocaleDateString("en-US", dateOptions);

      // Format time → e.g., 7:55 PM
      const formattedTime = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });

      setCurrentDate(formattedDate);
      setCurrentTime(formattedTime);
    };

    updateDateTime(); // run once immediately
    const timer = setInterval(updateDateTime, 1000); // update every second

    return () => clearInterval(timer); // cleanup
  }, []);

  return (
    <LinearGradient
      colors={["#D97706", "#F5EDE0"]}
      locations={[0, 0.99]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      className="flex h-[80px] w-full flex-col px-2 pt-1"
    >
      <View className="bg-orange-500 flex-row items-center px-3 pt-10">
        {/* Back button */}
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={27} color="black" />
        </TouchableOpacity>

        {/* Date + Time */}
        <View className="bg-orange-500 w-[97%] flex-row justify-end px-3 pt-1">
          <Text className="pr-7 font-poppins text-xl font-bold text-cozy_text">
            {currentDate}
          </Text>
          <Text className="text-md ml-auto font-poppins font-bold text-cozy_text">
            {currentTime}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
};

export default DiaryInputHeader;
