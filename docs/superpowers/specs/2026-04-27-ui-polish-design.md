# UI Polish: Loading States, Error Handling, Haptics, Pull-to-Refresh

> Date: 2026-04-27
> Status: Approved

## Summary

Add pull-to-refresh on meal plan, haptic feedback on interactions, error banner for generation failures, and standardized button press feedback.

## Pull-to-Refresh on Wochenplan

- Wrap ScrollView content in RefreshControl
- Pulling down triggers `regeneratePlan()`
- Shows native refresh spinner while `isGenerating` is true
- Keep the "Neu generieren" button too (RefreshControl may not work on web)

## Haptic Feedback (Native Only)

Install `expo-haptics`. All haptic calls gated behind `Platform.OS !== 'web'`.

| Interaction | Haptic Type |
|---|---|
| Check off shopping item | `ImpactFeedbackStyle.Light` |
| Tap "Neu generieren" / pull-to-refresh | `ImpactFeedbackStyle.Medium` |
| Complete last item in an aisle section | `NotificationFeedbackType.Success` |

## Error Handling

- `generationError` from `useMealPlanStore` displayed as a dismissable banner below the regenerate button
- Banner: warm red background (`#fef2f2`), red text (`#991b1b`), border (`#fecaca`), dismiss X button
- Shown only when `generationError` is not null
- Dismissed by tapping X or when next generation succeeds

## Button Feedback

- All Pressable elements: `opacity: 0.7` on press state
- Regenerate button: subtle scale down on press (`transform: [{ scale: 0.98 }]`)

## Files

### New
- `src/shared/components/ErrorBanner.tsx`

### Modified
- `src/features/meal-plan/screens/MealPlanScreen.tsx` — pull-to-refresh, error banner, button animation
- `src/features/shopping-list/components/ShoppingItemCard.tsx` — haptic on check
- `src/features/shopping-list/components/AisleSection.tsx` — haptic on last item (pass callback)

### Dependencies
- Install `expo-haptics`

## Out of Scope

- Skeleton loaders
- Toast library
- Animated tab transitions
- Swipe gestures on cards
