import { Stack } from "expo-router";

export default function RecipesLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="create"
        options={{
          title: "Ajouter une recette",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="explore"
        options={{
          title: "Explorer",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Recette",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="books/[bookId]"
        options={{
          title: "Livre de recettes",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
