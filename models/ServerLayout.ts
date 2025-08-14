import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface IMenuSection {
  id: string;
  name: string;
  icon: string;
  type: 'tv' | 'movies' | 'series';
  enabled: boolean;
  order: number;
}

export interface ILayoutColors {
  primary: string;
  secondary: string;
}

export interface ILayoutSettings {
  showSearch: boolean;
  showExpiration: boolean;
  showTime: boolean;
  showLogo: boolean;
  defaultLanguage: string;
}

export interface IServerLayout extends Document {
  serverId: ObjectId;
  colors: ILayoutColors;
  logoUrl: string;
  backgroundImageUrl?: string;
  menuSections: IMenuSection[];
  settings: ILayoutSettings;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MenuSectionSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    maxlength: 50,
  },
  icon: {
    type: String,
    required: true,
    maxlength: 50,
  },
  type: {
    type: String,
    enum: ['tv', 'movies', 'series'],
    required: true,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    required: true,
    min: 0,
  },
});

const LayoutColorsSchema = new Schema({
  primary: {
    type: String,
    required: true,
    match: /^#[0-9A-F]{6}$/i,
  },
  secondary: {
    type: String,
    required: true,
    match: /^#[0-9A-F]{6}$/i,
  },
});

const LayoutSettingsSchema = new Schema({
  showSearch: {
    type: Boolean,
    default: true,
  },
  showExpiration: {
    type: Boolean,
    default: true,
  },
  showTime: {
    type: Boolean,
    default: true,
  },
  showLogo: {
    type: Boolean,
    default: true,
  },
  defaultLanguage: {
    type: String,
    enum: ['pt', 'en', 'es'],
    default: 'pt',
  },
});

const ServerLayoutSchema = new Schema<IServerLayout>({
  serverId: {
    type: Schema.Types.ObjectId,
    ref: 'Server',
    required: true,
    unique: true,
  },
  colors: {
    type: LayoutColorsSchema,
    required: true,
  },
  logoUrl: {
    type: String,
    required: true,
    match: /^https?:\/\/.+/,
  },
  backgroundImageUrl: {
    type: String,
    match: /^https?:\/\/.+/,
  },
  menuSections: {
    type: [MenuSectionSchema],
    required: true,
    validate: {
      validator: function(sections: IMenuSection[]) {
        return sections.length === 3;
      },
      message: 'Deve ter exatamente 3 seções de menu (TV, Filmes, Séries)',
    },
  },
  settings: {
    type: LayoutSettingsSchema,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes
ServerLayoutSchema.index({ serverId: 1 });
ServerLayoutSchema.index({ isActive: 1 });

// Método para criar layout padrão
ServerLayoutSchema.statics.createDefaultLayout = function(serverId: ObjectId, serverData: any) {
  const defaultMenuSections: IMenuSection[] = [
    {
      id: 'tv',
      name: 'TV',
      icon: 'tv',
      type: 'tv',
      enabled: true,
      order: 0,
    },
    {
      id: 'movies',
      name: 'Filmes',
      icon: 'movie',
      type: 'movies',
      enabled: true,
      order: 1,
    },
    {
      id: 'series',
      name: 'Séries',
      icon: 'series',
      type: 'series',
      enabled: true,
      order: 2,
    },
  ];

  return new this({
    serverId,
    colors: {
      primary: serverData.corPrimaria || '#3B82F6',
      secondary: '#6B7280',
    },
    logoUrl: serverData.logoUrl || 'https://via.placeholder.com/200x100',
    menuSections: defaultMenuSections,
    settings: {
      showSearch: true,
      showExpiration: true,
      showTime: true,
      showLogo: true,
      defaultLanguage: 'pt',
    },
    isActive: true,
  });
};

export default mongoose.models.ServerLayout || mongoose.model<IServerLayout>('ServerLayout', ServerLayoutSchema);