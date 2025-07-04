import { ValidationError, ValidationResult, FormValidation } from '../types';

class ValidationService implements FormValidation {
  /**
   * Validate email format
   */
  validateEmail(email: string): ValidationError | null {
    if (!email) {
      return { field: 'email', message: 'E-postadress krävs', code: 'REQUIRED', value: email };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { field: 'email', message: 'Ogiltig e-postadress', code: 'INVALID_FORMAT', value: email };
    }
    
    return null;
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): ValidationError | null {
    if (!password) {
      return { field: 'password', message: 'Lösenord krävs', code: 'REQUIRED', value: password };
    }
    
    if (password.length < 6) {
      return { field: 'password', message: 'Lösenordet måste vara minst 6 tecken', code: 'TOO_SHORT', value: password };
    }
    
    return null;
  }

  /**
   * Validate name
   */
  validateName(name: string): ValidationError | null {
    if (!name || name.trim().length === 0) {
      return { field: 'name', message: 'Namn krävs', code: 'REQUIRED', value: name };
    }
    
    if (name.trim().length < 2) {
      return { field: 'name', message: 'Namnet måste vara minst 2 tecken', code: 'TOO_SHORT', value: name };
    }
    
    if (name.trim().length > 50) {
      return { field: 'name', message: 'Namnet får inte vara längre än 50 tecken', code: 'TOO_LONG', value: name };
    }
    
    return null;
  }

  /**
   * Validate sphere name
   */
  validateSphereName(name: string): ValidationError | null {
    if (!name || name.trim().length === 0) {
      return { field: 'sphereName', message: 'Sfärnamn krävs', code: 'REQUIRED', value: name };
    }
    
    if (name.trim().length < 2) {
      return { field: 'sphereName', message: 'Sfärnamnet måste vara minst 2 tecken', code: 'TOO_SHORT', value: name };
    }
    
    if (name.trim().length > 30) {
      return { field: 'sphereName', message: 'Sfärnamnet får inte vara längre än 30 tecken', code: 'TOO_LONG', value: name };
    }
    
    return null;
  }

  /**
   * Validate image file
   */
  validateImageFile(file: File): ValidationError | null {
    if (!file) {
      return { field: 'image', message: 'Bildfil krävs', code: 'REQUIRED', value: file };
    }
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { field: 'image', message: 'Endast bildfiler (JPEG, PNG, GIF, WebP) är tillåtna', code: 'INVALID_TYPE', value: file };
    }
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { field: 'image', message: 'Bildfilen får inte vara större än 10MB', code: 'TOO_LARGE', value: file };
    }
    
    return null;
  }

  /**
   * Validate diary entry content
   */
  validateDiaryContent(content: string): ValidationError | null {
    if (!content || content.trim().length === 0) {
      return { field: 'content', message: 'Innehåll krävs', code: 'REQUIRED', value: content };
    }
    
    if (content.trim().length > 5000) {
      return { field: 'content', message: 'Innehållet får inte vara längre än 5000 tecken', code: 'TOO_LONG', value: content };
    }
    
    return null;
  }

  /**
   * Validate date format (YYYY-MM-DD)
   */
  validateDate(date: string): ValidationError | null {
    if (!date) {
      return { field: 'date', message: 'Datum krävs', code: 'REQUIRED', value: date };
    }
    
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return { field: 'date', message: 'Ogiltigt datumformat (YYYY-MM-DD)', code: 'INVALID_FORMAT', value: date };
    }
    
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return { field: 'date', message: 'Ogiltigt datum', code: 'INVALID_DATE', value: date };
    }
    
    return null;
  }

  /**
   * Validate URL format
   */
  validateUrl(url: string): ValidationError | null {
    if (!url) {
      return { field: 'url', message: 'URL krävs', code: 'REQUIRED', value: url };
    }
    
    try {
      new URL(url);
    } catch {
      return { field: 'url', message: 'Ogiltig URL', code: 'INVALID_FORMAT', value: url };
    }
    
    return null;
  }

  /**
   * Validate hex color format
   */
  validateHexColor(color: string): ValidationError | null {
    if (!color) {
      return { field: 'color', message: 'Färg krävs', code: 'REQUIRED', value: color };
    }
    
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexRegex.test(color)) {
      return { field: 'color', message: 'Ogiltig hex-färg (t.ex. #FF0000)', code: 'INVALID_FORMAT', value: color };
    }
    
    return null;
  }

  /**
   * Validate field based on field name
   */
  validateField(field: string, value: any): ValidationError | null {
    switch (field) {
      case 'email':
        return this.validateEmail(value);
      case 'password':
        return this.validatePassword(value);
      case 'name':
        return this.validateName(value);
      case 'sphereName':
        return this.validateSphereName(value);
      case 'image':
        return this.validateImageFile(value);
      case 'content':
        return this.validateDiaryContent(value);
      case 'date':
        return this.validateDate(value);
      case 'url':
        return this.validateUrl(value);
      case 'color':
        return this.validateHexColor(value);
      default:
        return null;
    }
  }

  /**
   * Validate multiple fields
   */
  validate(values: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = [];
    
    for (const [field, value] of Object.entries(values)) {
      const error = this.validateField(field, value);
      if (error) {
        errors.push(error);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate user registration data
   */
  validateUserRegistration(data: { email: string; password: string; name: string }): ValidationResult {
    const errors: ValidationError[] = [];
    
    const emailError = this.validateEmail(data.email);
    if (emailError) errors.push(emailError);
    
    const passwordError = this.validatePassword(data.password);
    if (passwordError) errors.push(passwordError);
    
    const nameError = this.validateName(data.name);
    if (nameError) errors.push(nameError);
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate sphere creation data
   */
  validateSphereCreation(data: { name: string; gradientColors: [string, string] }): ValidationResult {
    const errors: ValidationError[] = [];
    
    const nameError = this.validateSphereName(data.name);
    if (nameError) errors.push(nameError);
    
    const color1Error = this.validateHexColor(data.gradientColors[0]);
    if (color1Error) {
      color1Error.field = 'gradientColor1';
      errors.push(color1Error);
    }
    
    const color2Error = this.validateHexColor(data.gradientColors[1]);
    if (color2Error) {
      color2Error.field = 'gradientColor2';
      errors.push(color2Error);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate image upload data
   */
  validateImageUpload(data: { file: File; name?: string }): ValidationResult {
    const errors: ValidationError[] = [];
    
    const fileError = this.validateImageFile(data.file);
    if (fileError) errors.push(fileError);
    
    if (data.name) {
      const nameError = this.validateName(data.name);
      if (nameError) {
        nameError.field = 'imageName';
        errors.push(nameError);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate diary entry data
   */
  validateDiaryEntry(data: { content: string; date: string }): ValidationResult {
    const errors: ValidationError[] = [];
    
    const contentError = this.validateDiaryContent(data.content);
    if (contentError) errors.push(contentError);
    
    const dateError = this.validateDate(data.date);
    if (dateError) errors.push(dateError);
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const validationService = new ValidationService();

// Export validation helpers
export const validate = {
  email: (email: string) => validationService.validateEmail(email),
  password: (password: string) => validationService.validatePassword(password),
  name: (name: string) => validationService.validateName(name),
  sphereName: (name: string) => validationService.validateSphereName(name),
  imageFile: (file: File) => validationService.validateImageFile(file),
  diaryContent: (content: string) => validationService.validateDiaryContent(content),
  date: (date: string) => validationService.validateDate(date),
  url: (url: string) => validationService.validateUrl(url),
  hexColor: (color: string) => validationService.validateHexColor(color),
  userRegistration: (data: { email: string; password: string; name: string }) => 
    validationService.validateUserRegistration(data),
  sphereCreation: (data: { name: string; gradientColors: [string, string] }) => 
    validationService.validateSphereCreation(data),
  imageUpload: (data: { file: File; name?: string }) => 
    validationService.validateImageUpload(data),
  diaryEntry: (data: { content: string; date: string }) => 
    validationService.validateDiaryEntry(data),
}; 