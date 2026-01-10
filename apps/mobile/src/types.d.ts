import "react-native";
import "react-native-safe-area-context";

declare module "react-native" {
    interface ViewProps {
        className?: string;
    }
    interface TextProps {
        className?: string;
    }
    interface ImageProps {
        className?: string;
    }
    interface TextInputProps {
        className?: string;
    }
    interface TouchableOpacityProps {
        className?: string;
    }
    interface PressableProps {
        className?: string;
    }
    interface ScrollViewProps {
        className?: string;
    }
    interface FlatListProps<ItemT> {
        className?: string;
    }
    interface SectionListProps<ItemT> {
        className?: string;
    }
    interface ImageBackgroundProps {
        className?: string;
    }
    interface ActivityIndicatorProps {
        className?: string;
    }
    interface KeyboardAvoidingViewProps {
        className?: string;
    }
    interface SafeAreaViewProps {
        className?: string;
    }
}

declare module "react-native-safe-area-context" {
    interface NativeSafeAreaViewProps {
        className?: string;
    }
}

declare module "*.png";
declare module "*.svg";
declare module "*.jpeg";
declare module "*.jpg";
