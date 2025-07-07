# Custom Hooks Documentation

Detta dokument beskriver alla custom hooks i REMI Story-applikationen.

## Core Hooks

### `useAppState`
Hanterar global applikationsstate och navigation.

**Användning:**
```typescript
const { currentView, handleNavigate, isSidebarExpanded } = useAppState();
```

### `useAuth`
Hanterar autentiseringsstate och användardata.

**Användning:**
```typescript
const { currentUser, isAuthenticated, login, logout } = useAuth();
```

### `useModalState`
Hanterar modal state och öppna/stänga modaler.

**Användning:**
```typescript
const { isModalOpen, openModal, closeModal } = useModalState();
```

### `useSphereManagement`
Hanterar sfär-relaterade operationer som skapande, bjudningar, etc.

**Användning:**
```typescript
const { createSphere, inviteToSphere, switchSphere } = useSphereManagement();
```

## Utility Hooks

### `useDebounce`
Debouncar värden för att förhindra överflödiga API-anrop.

**Användning:**
```typescript
const debouncedSearchTerm = useDebounce(searchTerm, 300);
```

### `useThrottle` / `useThrottledValue`
Throttlar värden för att begränsa frekvensen av uppdateringar.

**Användning:**
```typescript
const throttledValue = useThrottledValue(value, 100);
```

### `useFocusTrap`
Skapar en focus trap för modaler och dropdowns.

**Användning:**
```typescript
const focusTrapRef = useFocusTrap(isOpen);
```

### `useImageLoader`
Hanterar bildladdning med progress och error handling.

**Användning:**
```typescript
const { loadImage, progress, error } = useImageLoader();
```

## Feature Hooks

### `useAudioRecorder`
Hanterar ljudinspelning med transkribering.

**Användning:**
```typescript
const { startRecording, stopRecording, audioUrl, transcribedText } = useAudioRecorder();
```

### `useImageManagement`
Hanterar bilddata, skapare och fullscreen state.

**Användning:**
```typescript
const { image, creator, isLoading, isFullscreen, setIsFullscreen } = useImageManagement({
  imageId: 'image-123',
  currentUser
});
```

### `useCommentManagement`
Hanterar kommentarer, kommentarer och relaterad state.

**Användning:**
```typescript
const { comments, commenters, newCommentText, handleNewCommentTextChange } = useCommentManagement({
  userDescriptions,
  uploadedByUserId,
  currentUser
});
```

### `useAuthentication`
Hanterar autentiseringsstate och användardata.

**Användning:**
```typescript
const { isAuthenticated, currentUser, isLoading, error } = useAuthentication({
  handleLoginSuccess,
  fetchUserAndSphereData,
  setCurrentView,
  setIsAuthenticated,
  setCurrentUser,
  activeSphere
});
```

### `useTimeline`
Hanterar timeline state och datumnavigering.

**Användning:**
```typescript
const { 
  currentDate, 
  availableMonthsWithPosts, 
  handleYearSubmit, 
  handleMonthSubmit 
} = useTimeline({
  posts,
  onDateChange
});
```

## Best Practices

1. **Konsistent Naming**: Alla hooks följer `use` prefix konventionen
2. **TypeScript Support**: Alla hooks har fullständig TypeScript support
3. **Error Handling**: Hooks inkluderar proper error handling
4. **Performance**: Hooks använder `useCallback` och `useMemo` där lämpligt
5. **Documentation**: Alla hooks har JSDoc kommentarer

## Skapa Nya Hooks

När du skapar nya hooks:

1. Följ namngivningskonventionen `use[FeatureName]`
2. Inkludera TypeScript interfaces för props och return values
3. Lägg till JSDoc kommentarer
4. Exportera från `index.ts`
5. Uppdatera denna README 