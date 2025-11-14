import { Stack } from "expo-router";

export default function RecipesLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="create"
        options={{
          title: "Ajouter une recette",
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Modifier une recette",
        }}
      />
    </Stack>
  );
}
