import 'reflect-metadata';

// Verify reflect-metadata is loaded
if (!Reflect.getMetadata) {
  throw new Error(
    'reflect-metadata failed to load! Make sure it is imported before any decorators are used.',
  );
}

console.log('✓ Test environment: reflect-metadata initialized');



