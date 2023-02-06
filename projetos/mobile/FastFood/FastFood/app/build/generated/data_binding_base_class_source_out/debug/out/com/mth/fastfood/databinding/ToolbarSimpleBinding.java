// Generated by view binder compiler. Do not edit!
package com.mth.fastfood.databinding;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.widget.Toolbar;
import androidx.viewbinding.ViewBinding;
import com.mth.fastfood.R;
import java.lang.NullPointerException;
import java.lang.Override;

public final class ToolbarSimpleBinding implements ViewBinding {
  @NonNull
  private final Toolbar rootView;

  @NonNull
  public final Toolbar toolbar;

  private ToolbarSimpleBinding(@NonNull Toolbar rootView, @NonNull Toolbar toolbar) {
    this.rootView = rootView;
    this.toolbar = toolbar;
  }

  @Override
  @NonNull
  public Toolbar getRoot() {
    return rootView;
  }

  @NonNull
  public static ToolbarSimpleBinding inflate(@NonNull LayoutInflater inflater) {
    return inflate(inflater, null, false);
  }

  @NonNull
  public static ToolbarSimpleBinding inflate(@NonNull LayoutInflater inflater,
      @Nullable ViewGroup parent, boolean attachToParent) {
    View root = inflater.inflate(R.layout.toolbar_simple, parent, false);
    if (attachToParent) {
      parent.addView(root);
    }
    return bind(root);
  }

  @NonNull
  public static ToolbarSimpleBinding bind(@NonNull View rootView) {
    if (rootView == null) {
      throw new NullPointerException("rootView");
    }

    Toolbar toolbar = (Toolbar) rootView;

    return new ToolbarSimpleBinding((Toolbar) rootView, toolbar);
  }
}