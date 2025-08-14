import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface IMenuSection {
  id: string;
  name: string;
  icon: string;
  type: 'home' | 'movies' | 'series' | 'live' | 'custom';
  enabled: boolean;
  order: number;
  categoryId?: string; // Para seções customizadas
}

export interface ILayoutColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
}

export interface IServerLayout extends Document {
  serverId: ObjectId;
  colors: ILayoutColors;
  logoUrl: string;
  backgroundImageUrl?: string;
  menuSections: IMenuSection[];
  customization: {
    showCategories: boolean;
    showSearch: boolean;
    showFavorites: boolean;
    gridColumns: number;
    cardStyle: 'poster' | 'banner' | 'list';
  };
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
    enum: ['home', 'movies', 'series', 'live', 'custom'],
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
  categoryId: {
    type: String,
    maxlength: 50,
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
  background: {
    type: String,
    required: true,
    match: /^#[0-9A-F]{6}$/i,
  },
  text: {
    type: String,
    required: true,
    match: /^#[0-9A-F]{6}$/i,
  },
  accent: {
    type: String,
    required: true,
    match: /^#[0-9A-F]{6}$/i,
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
        return sections.length > 0 && sections.length <= 10;
      },
      message: 'Deve ter entre 1 e 10 seções de menu',
    },
  },
  customization: {
    showCategories: {
      type: Boolean,
      default: true,
    },
    showSearch: {
      type: Boolean,
      default: true,
    },
    showFavorites: {
      type: Boolean,
      default: true,
    },
    gridColumns: {
      type: Number,
      min: 2,
      max: 8,
      default: 4,
    },
    cardStyle: {
      type: String,
      enum: ['poster', 'banner', 'list'],
      default: 'poster',
    },
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
      id: 'home',
      name: 'Início',
      icon: 'home',
      type: 'home',
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
      icon: 'tv',
      type: 'series',
      enabled: true,
      order: 2,
    },
    {
      id: 'live',
      name: 'TV ao Vivo',
      icon: 'broadcast',
      type: 'live',
      enabled: true,
      order: 3,
    },
  ];

  return new this({
    serverId,
    colors: {
      primary: serverData.corPrimaria || '#3B82F6',
      secondary: '#6B7280',
      background: '#111827',
      text: '#FFFFFF',
      accent: '#10B981',
    },
    logoUrl: serverData.logoUrl || 'https://via.placeholder.com/200x100',
    menuSections: defaultMenuSections,
    customization: {
      showCategories: true,
      showSearch: true,
      showFavorites: true,
      gridColumns: 4,
      cardStyle: 'poster',
    },
    isActive: true,
  });
};

export default mongoose.models.ServerLayout || mongoose.model<IServerLayout>('ServerLayout', ServerLayoutSchema);